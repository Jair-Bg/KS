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

// Synthesize an order-book ladder from the current odds + market volume.
// Real markets stream this from a matching engine; for a demo prediction market
// we approximate depth so the UI feels alive and informative.
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

export function OrderBook({ marketId, yesOdds, noOdds, volume }: OrderBookProps) {
  const [tab, setTab] = useState<"book" | "trades">("book");
  const [trades, setTrades] = useState<TradeRow[]>([]);

  const ladder = useMemo(
    () => buildLadder(Math.round(yesOdds), volume),
    // re-roll only when mid moves meaningfully
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [Math.round(yesOdds), Math.round(volume / 1000)],
  );

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const { data } = await supabase
        .from("bets")
        .select("id, option, amount, odds_at_time, created_at")
        .eq("market_id", marketId)
        .order("created_at", { ascending: false })
        .limit(15);
      if (!cancelled) setTrades((data ?? []) as TradeRow[]);
    };
    load();

    const channel = supabase
      .channel(`trades-${marketId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "bets", filter: `market_id=eq.${marketId}` },
        (payload: any) => {
          setTrades((prev) => [payload.new as TradeRow, ...prev].slice(0, 15));
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [marketId]);

  const maxSize = Math.max(...ladder.asks.map((a) => a.size), ...ladder.bids.map((b) => b.size), 1);
  const spread = (ladder.asks[ladder.asks.length - 1]?.price ?? yesOdds) - (ladder.bids[0]?.price ?? yesOdds);

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-4 sm:px-5 pt-4">
        <h2 className="font-semibold text-foreground">Order book</h2>
        <div className="flex bg-secondary/60 rounded-lg p-0.5 text-xs">
          <button
            onClick={() => setTab("book")}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              tab === "book" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
            }`}
          >
            Depth
          </button>
          <button
            onClick={() => setTab("trades")}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              tab === "trades" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
            }`}
          >
            Trades
          </button>
        </div>
      </div>

      {tab === "book" ? (
        <div className="p-4 sm:p-5 pt-3">
          <div className="grid grid-cols-3 text-[11px] uppercase tracking-wider text-muted-foreground pb-2 border-b border-border/60">
            <span>Price (YES ¢)</span>
            <span className="text-right">Size</span>
            <span className="text-right">Total</span>
          </div>

          {/* Asks (sells / NO side, sorted high→low so best ask sits at bottom) */}
          <div className="divide-y divide-border/40">
            {ladder.asks.map((a, i) => {
              const pct = (a.size / maxSize) * 100;
              const total = ladder.asks.slice(i).reduce((s, x) => s + x.size, 0);
              return (
                <div key={`a-${i}`} className="relative grid grid-cols-3 py-1.5 text-sm font-mono">
                  <span
                    className="absolute inset-y-0 right-0 bg-destructive/10"
                    style={{ width: `${pct}%` }}
                    aria-hidden
                  />
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

          {/* Bids */}
          <div className="divide-y divide-border/40">
            {ladder.bids.map((b, i) => {
              const pct = (b.size / maxSize) * 100;
              const total = ladder.bids.slice(0, i + 1).reduce((s, x) => s + x.size, 0);
              return (
                <div key={`b-${i}`} className="relative grid grid-cols-3 py-1.5 text-sm font-mono">
                  <span
                    className="absolute inset-y-0 right-0 bg-primary/10"
                    style={{ width: `${pct}%` }}
                    aria-hidden
                  />
                  <span className="relative text-primary">{b.price}¢</span>
                  <span className="relative text-right text-foreground">{b.size.toLocaleString()}</span>
                  <span className="relative text-right text-muted-foreground">{total.toLocaleString()}</span>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
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
                    <span
                      className={`inline-flex items-center gap-1 font-medium ${
                        isYes ? "text-primary" : "text-destructive"
                      }`}
                    >
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
