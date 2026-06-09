import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Wallet, TrendingUp, History, Award, Loader2, Bookmark, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchUserBets, fetchWatchlistMarkets, removeFromWatchlist, formatVolume, type Bet, type Market } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useWallet } from "@/hooks/useWallet";
import { toast } from "@/hooks/use-toast";
export default function Dashboard() {
  const { user } = useAuth();
  const { balance } = useWallet();
  const [bets, setBets] = useState<Bet[]>([]);
  const [watchlist, setWatchlist] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [b, wl] = await Promise.all([fetchUserBets(), fetchWatchlistMarkets()]);
        setBets(b);
        setWatchlist(wl);
      } catch (e) {
        console.error("Failed to load dashboard:", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleUnwatch = async (marketId: string) => {
    setWatchlist((prev) => prev.filter((m) => m.id !== marketId));
    try {
      await removeFromWatchlist(marketId);
    } catch (e: any) {
      toast({ title: "Could not remove", description: e?.message, variant: "destructive" });
    }
  };

  const totalStaked = bets.reduce((s, b) => s + Number(b.amount), 0);
  const potentialPayout = bets.reduce((s, b) => s + Number(b.potential_payout), 0);
  const wins = bets.filter((b) => b.status === "won").length;

  const stats = [
    { label: "Balance", value: `$${balance.toFixed(2)}`, icon: Wallet },
    { label: "Total Staked", value: `$${totalStaked.toFixed(2)}`, icon: TrendingUp },
    { label: "Potential Payout", value: `$${potentialPayout.toFixed(2)}`, icon: Award },
    { label: "Active Bets", value: String(bets.filter((b) => b.status === "pending").length), icon: History },
  ];

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

  const displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Trader";

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Welcome back, {displayName}</h1>
            <p className="text-muted-foreground text-sm mt-1">Track your predictions, balance, and trading history.</p>
          </div>
          <Button variant="signup" size="pill" asChild>
            <a href="/markets">Browse Markets</a>
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-card rounded-xl border border-border p-5">
              <div className="flex items-center justify-between mb-3">
                <stat.icon className="w-5 h-5 text-primary" />
              </div>
              <div className="text-2xl font-bold text-foreground">{stat.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Watchlist */}
        <div className="bg-card rounded-xl border border-border overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <h2 className="font-semibold text-foreground flex items-center gap-2">
              <Bookmark className="w-4 h-4 text-primary" /> Watchlist
              <span className="text-xs text-muted-foreground font-normal">({watchlist.length})</span>
            </h2>
            <Button variant="ghost" size="sm" asChild>
              <a href="/markets">Find more →</a>
            </Button>
          </div>
          {watchlist.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <p className="text-muted-foreground text-sm mb-3">No saved markets yet.</p>
              <p className="text-muted-foreground text-xs">Tap the bookmark icon on any market card to save it here.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {watchlist.map((m) => (
                <div key={m.id} className="px-6 py-3 hover:bg-secondary/40 transition-colors flex items-center gap-4">
                  <a href={`/market/${m.id}`} className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate hover:text-primary transition-colors">{m.question}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="capitalize">{m.category}</span>
                      <span>Yes {Math.round(m.yes_odds)}%</span>
                      <span>{formatVolume(m.volume)} vol</span>
                    </div>
                  </a>
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => handleUnwatch(m.id)} title="Remove">
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bets table */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="font-semibold text-foreground">Your Predictions</h2>
          </div>
          {bets.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-muted-foreground mb-4">You haven't placed any predictions yet.</p>
              <Button variant="signup" size="pill" asChild>
                <a href="/markets">Find a Market</a>
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {bets.map((bet) => (
                <div key={bet.id} className="px-6 py-4 hover:bg-secondary/50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          bet.option.toLowerCase() === "yes"
                            ? "bg-primary/10 text-primary"
                            : "bg-muted text-muted-foreground"
                        }`}>
                          {bet.option}
                        </span>
                        <span className="text-xs text-muted-foreground">@ {Math.round(bet.odds_at_time)}%</span>
                      </div>
                      <a
                        href={`/market/${bet.market_id}`}
                        className="text-sm font-medium text-foreground hover:text-primary truncate block"
                      >
                        Market #{bet.market_id.slice(0, 8)}
                      </a>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-semibold text-foreground">${Number(bet.amount).toFixed(2)}</div>
                      <div className="text-xs text-success">→ ${Number(bet.potential_payout).toFixed(2)}</div>
                    </div>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full self-center ${
                      bet.status === "won" ? "bg-success/10 text-success" :
                      bet.status === "lost" ? "bg-destructive/10 text-destructive" :
                      "bg-secondary text-muted-foreground"
                    }`}>
                      {bet.status}
                    </span>
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
