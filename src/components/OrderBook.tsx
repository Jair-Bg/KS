import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

interface OrderBookProps {
  marketId: string;
  yesOdds: number;
  noOdds: number;
  volume: number;
}

interface TradeRow {
  id: string;
  option: string;
  amount: number;
  odds_at_time: number;
  created_at: string;
}

type Tab = "book" | "depth" | "trades";

// Synthesize an order-book ladder from the current odds + market volume.
function buildLadder(midYes: number, volume: number) {
  const baseDepth = Math.max(80, Math.round(volume / 40));
  const levels = 6;
  const asks: { price: number; size: number }[] = [];
  const bids: { price: number; size: number }[] = [];
  for (let i = 1; i <= levels; i++) {
    const ask = Math.min(99, Math.round(midYes + i));
    const bid = Math.max(1, Math.round(midYes - i));
    const decay = 1 / Math.sqrt(i);
    asks.push({ price: ask, size: Math.round(baseDepth * decay * (0.7 + Math.random() * 0.6)) });
    bids.push({ price: bid, size: Math.round(baseDepth * decay * (0.7 + Math.random() * 0.6)) });
  }
  return { asks: asks.reverse(), bids };
}

// Bucket real bets into dynamic price levels sized by the market's observed tick.
const TICK_CHOICES = [1, 2, 5, 10] as const;
type Tick = typeof TICK_CHOICES[number];

// Pick a tick so the depth ladder shows a readable number of levels (~8-20)
// spanning the observed price range. Falls back to 5¢ when data is thin.
function computeTick(rows: TradeRow[]): Tick {
  if (rows.length < 2) return 5;
  let min = Infinity, max = -Infinity;
  for (const r of rows) {
    const p = Number(r.odds_at_time);
    if (!Number.isFinite(p)) continue;
    if (p < min) min = p;
    if (p > max) max = p;
  }
  const range = Math.max(1, max - min);
  const ideal = range / 14; // target ~14 levels
  let best: Tick = 5;
  let bestDiff = Infinity;
  for (const t of TICK_CHOICES) {
    const levels = range / t;
    const penalty = levels < 6 ? (6 - levels) * 2 : levels > 24 ? (levels - 24) * 2 : 0;
    const diff = Math.abs(t - ideal) + penalty;
    if (diff < bestDiff) { bestDiff = diff; best = t; }
  }
  return best;
}

type DepthLevel = { price: number; buy: number; sell: number };

function aggregateDepth(rows: TradeRow[], bucket: number): DepthLevel[] {
  const map = new Map<number, DepthLevel>();
  const maxBucket = Math.floor(99 / bucket) * bucket;
  for (const r of rows) {
    const raw = Math.max(1, Math.min(99, Math.round(Number(r.odds_at_time))));
    const b = Math.max(bucket, Math.min(maxBucket, Math.round(raw / bucket) * bucket));
    const cur = map.get(b) ?? { price: b, buy: 0, sell: 0 };
    if (r.option.toLowerCase() === "yes") cur.buy += Number(r.amount);
    else cur.sell += Number(r.amount);
    map.set(b, cur);
  }
  return Array.from(map.values()).sort((a, b) => b.price - a.price);
}

export function OrderBook({ marketId, yesOdds, noOdds, volume }: OrderBookProps) {
  const [tab, setTab] = useState<Tab>("book");
  const [trades, setTrades] = useState<TradeRow[]>([]);
  const [allBets, setAllBets] = useState<TradeRow[]>([]);

  const ladder = useMemo(
    () => buildLadder(Math.round(yesOdds), volume),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [Math.round(yesOdds), Math.round(volume / 1000)],
  );

  // Recent trades feed
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("bets")
        .select("id, option, amount, odds_at_time, created_at")
        .eq("market_id", marketId)
        .order("created_at", { ascending: false })
        .limit(15);
      if (!cancelled) setTrades((data ?? []) as TradeRow[]);
    })();

    const channel = supabase
      .channel(`trades-${marketId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "bets", filter: `market_id=eq.${marketId}` },
        (payload: any) => {
          const row = payload.new as TradeRow;
          setTrades((prev) => [row, ...prev].slice(0, 15));
          setAllBets((prev) => [row, ...prev]);
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [marketId]);

  // Full bet history for depth aggregation
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("bets")
        .select("id, option, amount, odds_at_time, created_at")
        .eq("market_id", marketId)
        .order("created_at", { ascending: false })
        .limit(2000);
      if (!cancelled) setAllBets((data ?? []) as TradeRow[]);
    })();
    return () => {
      cancelled = true;
    };
  }, [marketId]);

  const depth = useMemo(() => aggregateDepth(allBets), [allBets]);
  const depthTotals = useMemo(() => {
    let buy = 0, sell = 0;
    for (const d of depth) { buy += d.buy; sell += d.sell; }
    return { buy, sell, total: buy + sell };
  }, [depth]);
  const maxSide = Math.max(1, ...depth.map((d) => Math.max(d.buy, d.sell)));

  const maxSize = Math.max(...ladder.asks.map((a) => a.size), ...ladder.bids.map((b) => b.size), 1);
  const spread = (ladder.asks[ladder.asks.length - 1]?.price ?? yesOdds) - (ladder.bids[0]?.price ?? yesOdds);

  const Tab = ({ id, label }: { id: Tab; label: string }) => (
    <button
      onClick={() => setTab(id)}
      className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
        tab === id ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-4 sm:px-5 pt-4">
        <h2 className="font-semibold text-foreground">Order book</h2>
        <div className="flex bg-secondary/60 rounded-lg p-0.5 text-xs">
          <Tab id="book" label="Book" />
          <Tab id="depth" label="Depth" />
          <Tab id="trades" label="Trades" />
        </div>
      </div>

      {tab === "book" && (
        <div className="p-4 sm:p-5 pt-3">
          <div className="grid grid-cols-3 text-[11px] uppercase tracking-wider text-muted-foreground pb-2 border-b border-border/60">
            <span>Price (YES ¢)</span>
            <span className="text-right">Size</span>
            <span className="text-right">Total</span>
          </div>
          <div className="divide-y divide-border/40">
            {ladder.asks.map((a, i) => {
              const pct = (a.size / maxSize) * 100;
              const total = ladder.asks.slice(i).reduce((s, x) => s + x.size, 0);
              return (
                <div key={`a-${i}`} className="relative grid grid-cols-3 py-1.5 text-sm font-mono">
                  <span className="absolute inset-y-0 right-0 bg-destructive/10" style={{ width: `${pct}%` }} aria-hidden />
                  <span className="relative text-destructive">{a.price}¢</span>
                  <span className="relative text-right text-foreground">{a.size.toLocaleString()}</span>
                  <span className="relative text-right text-muted-foreground">{total.toLocaleString()}</span>
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-between py-2 my-1 px-1 bg-secondary/40 rounded-md text-xs">
            <span className="text-muted-foreground">Mid</span>
            <span className="font-semibold text-foreground">{Math.round(yesOdds)}¢ YES · {Math.round(noOdds)}¢ NO</span>
            <span className="text-muted-foreground">Spread {Math.max(spread, 1)}¢</span>
          </div>
          <div className="divide-y divide-border/40">
            {ladder.bids.map((b, i) => {
              const pct = (b.size / maxSize) * 100;
              const total = ladder.bids.slice(0, i + 1).reduce((s, x) => s + x.size, 0);
              return (
                <div key={`b-${i}`} className="relative grid grid-cols-3 py-1.5 text-sm font-mono">
                  <span className="absolute inset-y-0 right-0 bg-primary/10" style={{ width: `${pct}%` }} aria-hidden />
                  <span className="relative text-primary">{b.price}¢</span>
                  <span className="relative text-right text-foreground">{b.size.toLocaleString()}</span>
                  <span className="relative text-right text-muted-foreground">{total.toLocaleString()}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {tab === "depth" && (
        <div className="p-4 sm:p-5 pt-3">
          {/* Summary header */}
          <div className="flex items-center justify-between mb-3 text-[11px] font-mono">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-sm bg-primary" />
              <span className="text-muted-foreground uppercase tracking-wider">Buy YES</span>
              <span className="text-primary font-semibold tabular-nums">${depthTotals.buy.toFixed(0)}</span>
            </div>
            <span className="text-muted-foreground tabular-nums">
              {depthTotals.total > 0
                ? `${Math.round((depthTotals.buy / depthTotals.total) * 100)}% / ${Math.round((depthTotals.sell / depthTotals.total) * 100)}%`
                : "—"}
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-destructive font-semibold tabular-nums">${depthTotals.sell.toFixed(0)}</span>
              <span className="text-muted-foreground uppercase tracking-wider">Sell NO</span>
              <span className="w-2 h-2 rounded-sm bg-destructive" />
            </div>
          </div>

          {/* Column headers */}
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-[10px] uppercase tracking-wider text-muted-foreground pb-2 border-b border-border/60">
            <span className="text-right">Sell volume</span>
            <span className="text-center w-12">Price</span>
            <span>Buy volume</span>
          </div>

          {depth.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No depth yet — be the first to trade.</p>
          ) : (
            <div className="divide-y divide-border/40">
              {depth.map((d) => {
                const buyPct = (d.buy / maxSide) * 100;
                const sellPct = (d.sell / maxSide) * 100;
                const isMid = Math.abs(d.price - Math.round(yesOdds)) < BUCKET;
                return (
                  <div
                    key={d.price}
                    className={`grid grid-cols-[1fr_auto_1fr] items-center gap-2 py-1.5 text-xs font-mono ${
                      isMid ? "bg-primary/5" : ""
                    }`}
                  >
                    {/* Sell side (left, fills right→left) */}
                    <div className="relative h-5 flex items-center justify-end pr-2">
                      <span
                        className="absolute inset-y-0 right-0 bg-destructive/15 rounded-l-sm"
                        style={{ width: `${sellPct}%` }}
                        aria-hidden
                      />
                      <span className={`relative tabular-nums ${d.sell > 0 ? "text-foreground" : "text-muted-foreground/60"}`}>
                        {d.sell > 0 ? `$${d.sell.toFixed(0)}` : "—"}
                      </span>
                    </div>
                    {/* Price (centered) */}
                    <span className={`w-12 text-center font-semibold tabular-nums ${
                      isMid ? "text-foreground" : "text-muted-foreground"
                    }`}>
                      {d.price}¢
                    </span>
                    {/* Buy side (right, fills left→right) */}
                    <div className="relative h-5 flex items-center pl-2">
                      <span
                        className="absolute inset-y-0 left-0 bg-primary/15 rounded-r-sm"
                        style={{ width: `${buyPct}%` }}
                        aria-hidden
                      />
                      <span className={`relative tabular-nums ${d.buy > 0 ? "text-foreground" : "text-muted-foreground/60"}`}>
                        {d.buy > 0 ? `$${d.buy.toFixed(0)}` : "—"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <p className="mt-3 text-[10px] text-muted-foreground/70 text-center">
            Aggregated from {allBets.length} trade{allBets.length === 1 ? "" : "s"} · {BUCKET}¢ price buckets
          </p>
        </div>
      )}

      {tab === "trades" && (
        <div className="p-4 sm:p-5 pt-3">
          {trades.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No trades yet — be the first.</p>
          ) : (
            <div className="divide-y divide-border/40">
              <div className="grid grid-cols-4 text-[11px] uppercase tracking-wider text-muted-foreground pb-2">
                <span>Side</span>
                <span className="text-right">Price</span>
                <span className="text-right">Amount</span>
                <span className="text-right">Time</span>
              </div>
              {trades.map((t) => {
                const isYes = t.option.toLowerCase() === "yes";
                return (
                  <div key={t.id} className="grid grid-cols-4 py-2 text-sm items-center">
                    <span className={`inline-flex items-center gap-1 font-medium ${isYes ? "text-primary" : "text-destructive"}`}>
                      {isYes ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                      {t.option}
                    </span>
                    <span className="text-right font-mono text-foreground">{Math.round(Number(t.odds_at_time))}¢</span>
                    <span className="text-right font-mono text-foreground">${Number(t.amount).toFixed(2)}</span>
                    <span className="text-right text-muted-foreground text-xs">
                      {new Date(t.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
