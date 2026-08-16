import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { DollarSign, Eye, BarChart3, TrendingUp, Copy, ExternalLink, Check, Loader2, Users, Activity, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  fetchCreatorStats,
  fetchCreatorMarkets,
  fetchCreatorAnalytics,
  formatVolume,
  type Market,
  type CreatorStats,
  type CreatorAnalytics,
} from "@/lib/api";
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from "recharts";

const RANGES = [
  { label: "7D", days: 7 },
  { label: "30D", days: 30 },
  { label: "90D", days: 90 },
];

type BetRow = {
  id: string;
  market_id: string;
  user_id: string;
  amount: number;
  created_at: string;
};

// ─── Modern Stock-Market Style Tooltip ──────────────────────────
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const vol = payload.find((p: any) => p.dataKey === "volume")?.value;
  const bets = payload.find((p: any) => p.dataKey === "bets")?.value;
  return (
    <div className="rounded-md border border-border bg-card/95 backdrop-blur-md px-3 py-2 shadow-xl shadow-black/30 font-mono">
      <div className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground mb-1">{label}</div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="w-1 h-3 rounded-sm bg-primary" />
          <span className="text-xs text-muted-foreground">VOL</span>
          <span className="text-sm font-semibold text-foreground tabular-nums">{formatVolume(Number(vol ?? 0))}</span>
        </div>
        {bets !== undefined && (
          <div className="flex items-center gap-1.5 border-l border-border pl-3">
            <span className="text-xs text-muted-foreground">BETS</span>
            <span className="text-sm font-semibold text-foreground tabular-nums">{Number(bets)}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function CategoryTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  return (
    <div className="rounded-md border border-border bg-card/95 backdrop-blur-md px-3 py-2 shadow-xl shadow-black/30 font-mono">
      <div className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground mb-1">{label}</div>
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-primary" />
        <span className="text-sm font-semibold text-foreground tabular-nums">{formatVolume(Number(p.value))}</span>
      </div>
    </div>
  );
}

export default function CreatorDashboard() {
  const [stats, setStats] = useState<CreatorStats | null>(null);
  const [markets, setMarkets] = useState<Market[]>([]);
  const [analytics, setAnalytics] = useState<CreatorAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [rangeDays, setRangeDays] = useState(30);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [pulsing, setPulsing] = useState(false);

  const reconcileTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pulseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const traderIdsRef = useRef<Set<string>>(new Set());
  // category lookup by market id, kept in sync with `markets`.
  const marketCategoryRef = useRef<Map<string, string>>(new Map());

  const triggerPulse = () => {
    setPulsing(true);
    if (pulseTimer.current) clearTimeout(pulseTimer.current);
    pulseTimer.current = setTimeout(() => setPulsing(false), 1200);
  };

  // Full fetch — used on mount and range change. Subsequent live updates
  // are applied incrementally; we only re-run the RPC as a debounced
  // reconciliation to true-up unique-trader counts.
  const loadAll = useCallback(async (days: number) => {
    try {
      const [s, m, a] = await Promise.all([
        fetchCreatorStats(),
        fetchCreatorMarkets(),
        fetchCreatorAnalytics(days),
      ]);
      setStats(s);
      setMarkets(m);
      marketCategoryRef.current = new Map(m.map((mk) => [mk.id, mk.category]));
      setAnalytics(a);
      // Reset trader-id ref — the count from the RPC is authoritative.
      traderIdsRef.current = new Set();
    } catch (e) {
      console.error("Failed to load creator dashboard:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  // Reconcile via the RPC after bursts settle (debounced).
  const scheduleReconcile = useCallback((days: number) => {
    if (reconcileTimer.current) clearTimeout(reconcileTimer.current);
    reconcileTimer.current = setTimeout(async () => {
      try {
        const a = await fetchCreatorAnalytics(days);
        setAnalytics(a);
        traderIdsRef.current = new Set();
      } catch (e) {
        console.error("Reconcile failed:", e);
      }
    }, 4000);
  }, []);

  // Apply a single new bet to local state without round-tripping.
  const applyBetIncrement = useCallback((bet: BetRow, days: number) => {
    const sinceMs = Date.now() - days * 86_400_000;
    const betMs = new Date(bet.created_at).getTime();
    const inPeriod = betMs >= sinceMs;
    const day = bet.created_at.slice(0, 10);
    const category = marketCategoryRef.current.get(bet.market_id) ?? "other";

    // Track unique trader (approximate; reconciled by debounced RPC).
    const newTrader = !traderIdsRef.current.has(bet.user_id);
    traderIdsRef.current.add(bet.user_id);

    // --- analytics ---
    setAnalytics((prev) => {
      if (!prev) return prev;
      const next: CreatorAnalytics = {
        ...prev,
        daily: prev.daily.slice(),
        by_category: prev.by_category.slice(),
        top_markets: prev.top_markets.slice(),
        totals: { ...prev.totals },
      };

      // daily — only mutate the affected bucket
      if (inPeriod) {
        const idx = next.daily.findIndex((d) => d.day === day);
        if (idx >= 0) {
          next.daily[idx] = {
            ...next.daily[idx],
            volume: next.daily[idx].volume + bet.amount,
            bets: next.daily[idx].bets + 1,
          };
        } else {
          next.daily.push({ day, volume: bet.amount, bets: 1 });
          next.daily.sort((a, b) => (a.day < b.day ? -1 : 1));
        }
      }

      // by_category — only the affected category
      const cIdx = next.by_category.findIndex((c) => c.category === category);
      if (cIdx >= 0) {
        next.by_category[cIdx] = {
          ...next.by_category[cIdx],
          volume: next.by_category[cIdx].volume + bet.amount,
        };
        next.by_category.sort((a, b) => b.volume - a.volume);
      }

      // top_markets — only the affected market
      const tIdx = next.top_markets.findIndex((t) => t.id === bet.market_id);
      if (tIdx >= 0) {
        next.top_markets[tIdx] = {
          ...next.top_markets[tIdx],
          volume: next.top_markets[tIdx].volume + bet.amount,
        };
        next.top_markets.sort((a, b) => b.volume - a.volume);
      }

      // totals
      next.totals.total_bets += 1;
      if (inPeriod) next.totals.volume_period += bet.amount;
      if (newTrader) next.totals.unique_traders += 1;
      next.totals.avg_bet =
        next.totals.total_bets > 0
          ? (prev.totals.avg_bet * prev.totals.total_bets + bet.amount) / next.totals.total_bets
          : 0;

      return next;
    });

    // --- markets list (only the affected market) ---
    setMarkets((prev) =>
      prev.map((m) =>
        m.id === bet.market_id
          ? { ...m, volume: Number(m.volume) + bet.amount, total_traders: m.total_traders + (newTrader ? 1 : 0) }
          : m
      )
    );

    // --- top KPI cards (only volume + earnings shift) ---
    setStats((prev) => {
      if (!prev) return prev;
      // The stored strings are formatted; rebuild from the freshly-updated markets.
      // We compute deltas to keep this O(1) without scanning.
      // Total volume delta = bet.amount; earnings = 5% of volume.
      const parse = (s: string): number => {
        const n = parseFloat(s.replace(/[^0-9.]/g, "")) || 0;
        if (s.includes("M")) return n * 1_000_000;
        if (s.includes("K")) return n * 1_000;
        return n;
      };
      const newVol = parse(prev.totalVolume) + bet.amount;
      const newEarn = parse(prev.totalEarnings) + bet.amount * 0.05;
      return {
        ...prev,
        totalVolume: formatVolume(newVol),
        totalEarnings: formatVolume(newEarn),
      };
    });

    triggerPulse();
    scheduleReconcile(days);
  }, [scheduleReconcile]);

  useEffect(() => {
    loadAll(rangeDays);
  }, [rangeDays, loadAll]);

  // Realtime: incrementally apply new bets on the creator's markets.
  useEffect(() => {
    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    async function setup() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) return;

      const { data: mine } = await supabase
        .from("markets")
        .select("id, category")
        .eq("creator_id", user.id);
      const idSet = new Set((mine ?? []).map((r: any) => r.id as string));
      marketCategoryRef.current = new Map((mine ?? []).map((r: any) => [r.id, r.category]));
      if (cancelled) return;

      channel = supabase
        .channel("creator-analytics")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "bets" },
          (payload) => {
            const row = payload.new as any;
            if (!row?.market_id || !idSet.has(row.market_id)) return;
            applyBetIncrement(
              {
                id: row.id,
                market_id: row.market_id,
                user_id: row.user_id,
                amount: Number(row.amount),
                created_at: row.created_at,
              },
              rangeDays,
            );
          }
        )
        .subscribe();
    }
    setup();

    return () => {
      cancelled = true;
      if (reconcileTimer.current) clearTimeout(reconcileTimer.current);
      if (pulseTimer.current) clearTimeout(pulseTimer.current);
      if (channel) supabase.removeChannel(channel);
    };
  }, [rangeDays, applyBetIncrement]);

  const handleCopyEmbed = (marketId: string) => {
    const baseUrl = window.location.origin;
    const code = `<iframe src="${baseUrl}/embed/${marketId}" width="100%" height="220" frameborder="0" style="border:none;border-radius:12px;"></iframe>`;
    navigator.clipboard.writeText(code);
    setCopiedId(marketId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const statItems = stats
    ? [
        { label: "Total Earnings", value: stats.totalEarnings, icon: DollarSign },
        { label: "Total Volume", value: stats.totalVolume, icon: BarChart3 },
        { label: "Embed Views", value: stats.embedViews, icon: Eye },
        { label: "Active Markets", value: String(stats.activeMarkets), icon: TrendingUp },
      ]
    : [];

  const periodItems = analytics
    ? [
        { label: `Volume (${rangeDays}d)`, value: formatVolume(analytics.totals.volume_period), icon: Wallet },
        { label: "Unique Traders", value: analytics.totals.unique_traders.toLocaleString(), icon: Users },
        { label: "Total Bets", value: analytics.totals.total_bets.toLocaleString(), icon: Activity },
        { label: "Avg Bet", value: formatVolume(analytics.totals.avg_bet), icon: DollarSign },
      ]
    : [];

  const dailyData = analytics?.daily ?? [];
  const categoryData = analytics?.by_category ?? [];

  // Trend indicator on the area chart
  const trend = useMemo(() => {
    if (dailyData.length < 2) return 0;
    const half = Math.floor(dailyData.length / 2);
    const a = dailyData.slice(0, half).reduce((s, d) => s + d.volume, 0);
    const b = dailyData.slice(half).reduce((s, d) => s + d.volume, 0);
    if (a === 0) return b > 0 ? 100 : 0;
    return ((b - a) / a) * 100;
  }, [dailyData]);

  if (loading) {
    return (
      <CreatorLayout title="Creator Dashboard" description="Track your markets, earnings, and embed performance.">
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </CreatorLayout>
    );
  }

  return (
    <CreatorLayout
      title="Creator Dashboard"
      description="Track your markets, earnings, and embed performance."
      actions={
        <>
          <Button variant="outline" size="pill" asChild>
            <Link to="/embeds">Embed Toolkit</Link>
          </Button>
          <Button variant="signup" size="pill" asChild>
            <Link to="/create">+ New Market</Link>
          </Button>
        </>
      }
    >


        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {statItems.map((stat) => (
            <div key={stat.label} className="bg-card rounded-xl border border-border p-5">
              <stat.icon className="w-5 h-5 text-primary mb-3" />
              <div className="text-2xl font-bold text-foreground">{stat.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Analytics */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-foreground">Analytics</h2>
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="relative flex h-2 w-2">
                  {pulsing && (
                    <span className="absolute inline-flex h-full w-full rounded-full bg-success opacity-75 animate-ping" />
                  )}
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
                </span>
                Live
              </span>
            </div>
            <div className="flex items-center gap-1 bg-card border border-border rounded-full p-1">
              {RANGES.map((r) => (
                <button
                  key={r.days}
                  onClick={() => setRangeDays(r.days)}
                  className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                    rangeDays === r.days
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {periodItems.map((stat) => (
              <div key={stat.label} className="bg-card rounded-xl border border-border p-5">
                <stat.icon className="w-5 h-5 text-primary mb-3" />
                <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* ── Stock-style price + volume chart ─────────────────── */}
            <div className="relative overflow-hidden bg-card rounded-2xl border border-border lg:col-span-2">
              <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.06] via-transparent to-transparent pointer-events-none" />
              {/* Ticker header */}
              <div className="relative px-5 pt-5 pb-3 border-b border-border/60">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-primary/10 border border-primary/20">
                      <span className="text-[10px] font-mono font-bold tracking-wider text-primary">$VOL</span>
                    </div>
                    <div>
                      <div className="text-[10px] font-mono uppercase tracking-[0.15em] text-muted-foreground">Total Volume · {rangeDays}D</div>
                      <div className="flex items-baseline gap-2 mt-0.5">
                        <span className="text-2xl font-bold font-mono tabular-nums text-foreground">
                          {formatVolume(analytics?.totals.volume_period ?? 0)}
                        </span>
                        <span className={`text-sm font-mono font-semibold tabular-nums ${
                          trend >= 0 ? "text-success" : "text-destructive"
                        }`}>
                          {trend >= 0 ? "▲" : "▼"} {Math.abs(trend).toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  </div>
                  {/* OHLC-style stat strip */}
                  <div className="flex items-center gap-4 font-mono text-[11px]">
                    <div className="flex flex-col">
                      <span className="text-[9px] uppercase tracking-wider text-muted-foreground">High</span>
                      <span className="text-foreground tabular-nums font-semibold">
                        {formatVolume(Math.max(0, ...dailyData.map(d => d.volume)))}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] uppercase tracking-wider text-muted-foreground">Low</span>
                      <span className="text-foreground tabular-nums font-semibold">
                        {formatVolume(dailyData.length ? Math.min(...dailyData.map(d => d.volume)) : 0)}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] uppercase tracking-wider text-muted-foreground">Avg</span>
                      <span className="text-foreground tabular-nums font-semibold">
                        {formatVolume(dailyData.length ? dailyData.reduce((s, d) => s + d.volume, 0) / dailyData.length : 0)}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] uppercase tracking-wider text-muted-foreground">Bets</span>
                      <span className="text-foreground tabular-nums font-semibold">
                        {dailyData.reduce((s, d) => s + d.bets, 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Combined price + volume chart */}
              <div className="relative h-80 p-3 pr-5">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={dailyData} margin={{ top: 12, right: 8, left: -4, bottom: 0 }}>
                    <defs>
                      <linearGradient id="priceFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.45} />
                        <stop offset="50%" stopColor="hsl(var(--primary))" stopOpacity={0.12} />
                        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="volBar" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.6} />
                        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.15} />
                      </linearGradient>
                      <filter id="lineGlow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="2.5" result="blur" />
                        <feMerge>
                          <feMergeNode in="blur" />
                          <feMergeNode in="SourceGraphic" />
                        </feMerge>
                      </filter>
                    </defs>
                    <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="1 4" vertical={false} opacity={0.5} />
                    <XAxis
                      dataKey="day"
                      tickFormatter={(v) => v.slice(5)}
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      dy={6}
                      minTickGap={20}
                    />
                    {/* Price axis (right side, like real trading charts) */}
                    <YAxis
                      yAxisId="price"
                      orientation="right"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => formatVolume(Number(v))}
                      width={50}
                    />
                    {/* Volume axis (hidden, scaled smaller) */}
                    <YAxis
                      yAxisId="vol"
                      orientation="left"
                      hide
                      domain={[0, (dataMax: number) => dataMax * 4]}
                    />
                    <Tooltip
                      content={<ChartTooltip />}
                      cursor={{ stroke: "hsl(var(--primary))", strokeDasharray: "2 4", strokeOpacity: 0.7, strokeWidth: 1 }}
                    />
                    {/* Volume bars at bottom */}
                    <Bar
                      yAxisId="vol"
                      dataKey="bets"
                      fill="url(#volBar)"
                      radius={[2, 2, 0, 0]}
                      maxBarSize={14}
                    />
                    {/* Price area */}
                    <Area
                      yAxisId="price"
                      type="monotone"
                      dataKey="volume"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      fill="url(#priceFill)"
                      filter="url(#lineGlow)"
                      activeDot={{ r: 4, fill: "hsl(var(--primary))", stroke: "hsl(var(--card))", strokeWidth: 2 }}
                    />
                    {/* Reference line at average */}
                    {dailyData.length > 0 && (
                      <ReferenceLine
                        yAxisId="price"
                        y={dailyData.reduce((s, d) => s + d.volume, 0) / dailyData.length}
                        stroke="hsl(var(--muted-foreground))"
                        strokeDasharray="2 4"
                        strokeOpacity={0.4}
                      />
                    )}
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* ── Sector breakdown (stock-style) ───────────────────── */}
            <div className="relative overflow-hidden bg-card rounded-2xl border border-border">
              <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.06] via-transparent to-transparent pointer-events-none" />
              <div className="relative px-5 pt-5 pb-3 border-b border-border/60">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-[0.15em] text-muted-foreground">Sectors</div>
                    <h3 className="text-sm font-semibold text-foreground mt-0.5">Volume by category</h3>
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground tabular-nums">
                    {categoryData.length} {categoryData.length === 1 ? "sector" : "sectors"}
                  </span>
                </div>
              </div>
              <div className="relative p-4 h-[19.5rem] overflow-y-auto">
                {categoryData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                    No sector data yet
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {(() => {
                      const total = categoryData.reduce((s, c) => s + c.volume, 0) || 1;
                      const max = Math.max(...categoryData.map((c) => c.volume), 1);
                      return categoryData.map((c) => {
                        const pct = (c.volume / total) * 100;
                        const widthPct = (c.volume / max) * 100;
                        return (
                          <div key={c.category} className="group">
                            <div className="flex items-center justify-between mb-1 font-mono text-[11px]">
                              <span className="uppercase tracking-wider text-foreground font-semibold">
                                {c.category}
                              </span>
                              <div className="flex items-center gap-2 tabular-nums">
                                <span className="text-muted-foreground">{pct.toFixed(1)}%</span>
                                <span className="text-foreground font-semibold w-14 text-right">
                                  {formatVolume(c.volume)}
                                </span>
                              </div>
                            </div>
                            <div className="relative h-2 rounded-sm bg-secondary/60 overflow-hidden">
                              <div
                                className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-primary/50 rounded-sm transition-all duration-500 group-hover:from-primary group-hover:to-primary/70"
                                style={{ width: `${widthPct}%` }}
                              />
                              <div className="absolute inset-y-0 left-0 bg-primary/20 blur-sm" style={{ width: `${widthPct}%` }} />
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="font-semibold text-foreground">Your Markets</h2>
          </div>
          {markets.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-muted-foreground mb-4">You haven't created any markets yet.</p>
              <Button variant="signup" size="pill" asChild>
                <a href="/create">Create Your First Market</a>
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {markets.map((market) => (
                <div key={market.id} className="px-6 py-4 hover:bg-secondary/50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`w-2 h-2 rounded-full ${market.status === "active" ? "bg-success" : "bg-muted-foreground"}`} />
                        <span className="font-medium text-foreground text-sm truncate">{market.question}</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="capitalize">{market.category}</span>
                        <span>Yes: {Math.round(market.yes_odds)}%</span>
                        <span>{(market.embed_views || 0).toLocaleString()} embed views</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 shrink-0">
                      <div className="text-right">
                        <div className="text-sm font-semibold text-foreground">{formatVolume(market.volume)}</div>
                        <div className="text-xs text-muted-foreground">volume</div>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleCopyEmbed(market.id)}>
                          {copiedId === market.id ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                          <a href={`/embed/${market.id}`} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
    </CreatorLayout>

  );
}
