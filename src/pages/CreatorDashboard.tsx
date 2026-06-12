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
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
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

// ─── Modern Recharts Tooltip ────────────────────────────────────
function ChartTooltip({ active, payload, label, valueLabel = "Volume" }: any) {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  return (
    <div className="rounded-lg border border-border bg-card/95 backdrop-blur px-3 py-2 shadow-lg shadow-black/20">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">{label}</div>
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full" style={{ background: p.color || "hsl(var(--primary))" }} />
        <span className="text-sm font-semibold text-foreground">{formatVolume(Number(p.value))}</span>
        <span className="text-[11px] text-muted-foreground">{valueLabel}</span>
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
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-8 flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Creator Dashboard</h1>
            <p className="text-muted-foreground text-sm mt-1">Track your markets, earnings, and embed performance.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="pill" asChild>
              <a href="/embeds">Embed Toolkit</a>
            </Button>
            <Button variant="signup" size="pill" asChild>
              <a href="/create">+ New Market</a>
            </Button>
          </div>
        </div>

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
            {/* Volume area chart */}
            <div className="relative overflow-hidden bg-card rounded-2xl border border-border p-5 lg:col-span-2">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.04] via-transparent to-transparent pointer-events-none" />
              <div className="relative flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Volume over time</h3>
                  <p className="text-xs text-muted-foreground">Daily bet volume on your markets</p>
                </div>
                <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
                  trend >= 0 ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
                }`}>
                  <TrendingUp className={`w-3 h-3 ${trend < 0 ? "rotate-180" : ""}`} />
                  {trend >= 0 ? "+" : ""}{trend.toFixed(1)}%
                </div>
              </div>
              <div className="relative h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailyData} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                    <defs>
                      <linearGradient id="volFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.5} />
                        <stop offset="60%" stopColor="hsl(var(--primary))" stopOpacity={0.12} />
                        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="volStroke" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="hsl(var(--primary))" />
                        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.7} />
                      </linearGradient>
                      <filter id="volGlow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="3" result="blur" />
                        <feMerge>
                          <feMergeNode in="blur" />
                          <feMergeNode in="SourceGraphic" />
                        </feMerge>
                      </filter>
                    </defs>
                    <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="2 6" vertical={false} opacity={0.6} />
                    <XAxis
                      dataKey="day"
                      tickFormatter={(v) => v.slice(5)}
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      dy={6}
                    />
                    <YAxis
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => formatVolume(Number(v))}
                      width={48}
                    />
                    <Tooltip
                      content={<ChartTooltip valueLabel="Volume" />}
                      cursor={{ stroke: "hsl(var(--primary))", strokeDasharray: "3 3", strokeOpacity: 0.5 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="volume"
                      stroke="url(#volStroke)"
                      strokeWidth={2.5}
                      fill="url(#volFill)"
                      filter="url(#volGlow)"
                      activeDot={{ r: 5, fill: "hsl(var(--primary))", stroke: "hsl(var(--card))", strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Category bars */}
            <div className="relative overflow-hidden bg-card rounded-2xl border border-border p-5">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.04] via-transparent to-transparent pointer-events-none" />
              <div className="relative mb-4">
                <h3 className="text-sm font-semibold text-foreground">Volume by category</h3>
                <p className="text-xs text-muted-foreground">Across all your markets</p>
              </div>
              <div className="relative h-72">
                {categoryData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                    No data yet
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryData} layout="vertical" margin={{ top: 4, right: 12, left: 4, bottom: 0 }}>
                      <defs>
                        <linearGradient id="barFill" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.85} />
                          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.45} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="2 6" horizontal={false} opacity={0.6} />
                      <XAxis
                        type="number"
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v) => formatVolume(Number(v))}
                      />
                      <YAxis
                        type="category"
                        dataKey="category"
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        width={80}
                        tickFormatter={(v) => String(v).charAt(0).toUpperCase() + String(v).slice(1)}
                      />
                      <Tooltip
                        content={<ChartTooltip valueLabel="Volume" />}
                        cursor={{ fill: "hsl(var(--primary) / 0.08)" }}
                      />
                      <Bar dataKey="volume" fill="url(#barFill)" radius={[0, 8, 8, 0]} barSize={18} />
                    </BarChart>
                  </ResponsiveContainer>
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
      </main>
      <Footer />
    </div>
  );
}
