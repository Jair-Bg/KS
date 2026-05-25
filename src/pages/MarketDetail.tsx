import { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { OddsChart } from "@/components/OddsChart";
import { OrderBook } from "@/components/OrderBook";
import { TradeTicket } from "@/components/TradeTicket";
import { fetchMarket, marketToOptions, formatVolume, type Market } from "@/lib/api";
import { ArrowLeft, TrendingUp, Users, Calendar, Loader2 } from "lucide-react";

export default function MarketDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [market, setMarket] = useState<Market | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialPick, setInitialPick] = useState<string | undefined>(undefined);
  const [chartKey, setChartKey] = useState(0);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const m = await fetchMarket(id);
      setMarket(m);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  // Pre-fill the trade ticket pick when arriving from an embed with ?pick=Yes/No
  useEffect(() => {
    if (!market) return;
    const pick = searchParams.get("pick");
    if (!pick) return;
    const options = marketToOptions(market);
    const match = options.find((o) => o.name.toLowerCase() === pick.toLowerCase());
    if (match) {
      setInitialPick(match.name);
      const next = new URLSearchParams(searchParams);
      next.delete("pick");
      setSearchParams(next, { replace: true });
    }
  }, [market, searchParams, setSearchParams]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-16 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!market) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-16 text-center">
          <h1 className="text-2xl font-bold mb-2">Market not found</h1>
          <Button variant="outline" onClick={() => navigate("/markets")}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Markets
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  const options = marketToOptions(market);
  const endDate = new Date(market.end_date).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const handlePlaced = async () => {
    await load();
    setChartKey((k) => k + 1);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-6 sm:py-10 max-w-6xl">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="mb-4 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>

        <div className="grid lg:grid-cols-[1fr,360px] gap-6">
          {/* Left: question, chart, stats */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="inline-block px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium uppercase tracking-wide">
                  {market.category}
                </span>
                {market.status === "resolved" && (
                  <span className="inline-block px-2.5 py-1 rounded-full bg-success/15 text-success text-xs font-semibold uppercase tracking-wide">
                    Resolved · {market.resolution}
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground leading-tight">
                {market.question}
              </h1>
              {market.description && (
                <p className="text-muted-foreground mt-3 leading-relaxed">{market.description}</p>
              )}
              {market.status === "resolved" && (
                <div className="mt-4 p-4 rounded-xl border border-success/30 bg-success/5 text-sm">
                  <p className="font-semibold text-foreground">
                    Market settled — outcome: <span className="text-success">{market.resolution}</span>
                  </p>
                  <p className="text-muted-foreground mt-1">
                    Winning positions were paid out automatically to demo balances.
                  </p>
                </div>
              )}
            </div>

            <div className="bg-card border border-border rounded-2xl p-4 sm:p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-foreground">Odds history</h2>
                <div className="flex gap-3 text-xs">
                  <span className="inline-flex items-center gap-1.5 text-foreground">
                    <span className="w-2 h-2 rounded-full bg-primary" /> Yes
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                    <span className="w-2 h-2 rounded-full bg-muted-foreground" /> No
                  </span>
                </div>
              </div>
              <OddsChart key={chartKey} marketId={market.id} height={280} />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                  <TrendingUp className="w-3.5 h-3.5" /> Volume
                </div>
                <div className="text-lg font-bold text-foreground">{formatVolume(market.volume)}</div>
              </div>
              <div className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                  <Users className="w-3.5 h-3.5" /> Traders
                </div>
                <div className="text-lg font-bold text-foreground">{market.total_traders.toLocaleString()}</div>
              </div>
              <div className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                  <Calendar className="w-3.5 h-3.5" /> Ends
                </div>
                <div className="text-lg font-bold text-foreground">{endDate}</div>
              </div>
            </div>

            <OrderBook
              marketId={market.id}
              yesOdds={Number(market.yes_odds)}
              noOdds={Number(market.no_odds)}
              volume={Number(market.volume)}
            />
          </div>

          {/* Right: inline trade ticket */}
          <aside className="lg:sticky lg:top-24 self-start">
            {market.status === "resolved" ? (
              <div className="bg-card border border-border rounded-2xl p-5 text-center space-y-2">
                <h3 className="font-semibold text-foreground">Trading closed</h3>
                <p className="text-sm text-muted-foreground">
                  This market resolved <span className="text-success font-semibold">{market.resolution}</span>.
                </p>
              </div>
            ) : (
              <TradeTicket
                marketId={market.id}
                question={market.question}
                options={options}
                initialPick={initialPick}
                onPlaced={handlePlaced}
              />
            )}
          </aside>
        </div>
      </main>


      <Footer />
    </div>
  );
}
