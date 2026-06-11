import { useState, useEffect } from "react";
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

export default function CreatorDashboard() {
  const [stats, setStats] = useState<CreatorStats | null>(null);
  const [markets, setMarkets] = useState<Market[]>([]);
  const [analytics, setAnalytics] = useState<CreatorAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [rangeDays, setRangeDays] = useState(30);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [s, m, a] = await Promise.all([
          fetchCreatorStats(),
          fetchCreatorMarkets(),
          fetchCreatorAnalytics(rangeDays),
        ]);
        if (cancelled) return;
        setStats(s);
        setMarkets(m);
        setAnalytics(a);
      } catch (e) {
        console.error("Failed to load creator dashboard:", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [rangeDays]);

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

  const dailyData = analytics?.daily ?? [];
  const categoryData = analytics?.by_category ?? [];

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
            <h2 className="text-lg font-semibold text-foreground">Analytics</h2>
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
            <div className="bg-card rounded-xl border border-border p-5 lg:col-span-2">
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-foreground">Volume over time</h3>
                <p className="text-xs text-muted-foreground">Daily bet volume on your markets</p>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailyData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="volFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="day"
                      tickFormatter={(v) => v.slice(5)}
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => formatVolume(Number(v))}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                      formatter={(v: number, n) => [n === "volume" ? formatVolume(v) : v, n === "volume" ? "Volume" : "Bets"]}
                    />
                    <Area type="monotone" dataKey="volume" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#volFill)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-card rounded-xl border border-border p-5">
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-foreground">Volume by category</h3>
                <p className="text-xs text-muted-foreground">Across all your markets</p>
              </div>
              <div className="h-64">
                {categoryData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                    No data yet
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                      <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="category" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => formatVolume(Number(v))} />
                      <Tooltip
                        contentStyle={{
                          background: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: 8,
                          fontSize: 12,
                        }}
                        formatter={(v: number) => [formatVolume(v), "Volume"]}
                        cursor={{ fill: "hsl(var(--muted) / 0.3)" }}
                      />
                      <Bar dataKey="volume" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
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

