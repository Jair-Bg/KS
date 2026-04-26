import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { DollarSign, Eye, BarChart3, TrendingUp, Copy, ExternalLink, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchCreatorStats, fetchCreatorMarkets, formatVolume, type Market, type CreatorStats } from "@/lib/api";

export default function CreatorDashboard() {
  const [stats, setStats] = useState<CreatorStats | null>(null);
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [s, m] = await Promise.all([fetchCreatorStats(), fetchCreatorMarkets()]);
        setStats(s);
        setMarkets(m);
      } catch (e) {
        console.error("Failed to load creator dashboard:", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleCopyEmbed = (marketId: string) => {
    const baseUrl = window.location.origin;
    const code = `<iframe src="${baseUrl}/embed/${marketId}" width="100%" height="220" frameborder="0" style="border:none;border-radius:12px;"></iframe>`;
    navigator.clipboard.writeText(code);
    setCopiedId(marketId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const statItems = stats ? [
    { label: "Total Earnings", value: stats.totalEarnings, icon: DollarSign },
    { label: "Total Volume", value: stats.totalVolume, icon: BarChart3 },
    { label: "Embed Views", value: stats.embedViews, icon: Eye },
    { label: "Active Markets", value: String(stats.activeMarkets), icon: TrendingUp },
  ] : [];

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

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statItems.map((stat) => (
            <div key={stat.label} className="bg-card rounded-xl border border-border p-5">
              <stat.icon className="w-5 h-5 text-primary mb-3" />
              <div className="text-2xl font-bold text-foreground">{stat.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

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
