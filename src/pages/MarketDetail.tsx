import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { OddsChart } from "@/components/OddsChart";
import { BetModal } from "@/components/BetModal";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { formatVolume } from "@/lib/api";
import { Loader2, Clock, Users, BarChart3, ArrowLeft, TrendingUp, Share2, Copy, Check } from "lucide-react";

interface MarketData {
  id: string;
  question: string;
  description: string | null;
  category: string;
  market_type: string;
  status: string;
  yes_odds: number;
  no_odds: number;
  volume: number;
  total_traders: number;
  embed_views: number;
  end_date: string;
  created_at: string;
}

interface MarketOption {
  id: string;
  name: string;
  odds: number;
  sort_order: number;
}

export default function MarketDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [market, setMarket] = useState<MarketData | null>(null);
  const [options, setOptions] = useState<MarketOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [betModal, setBetModal] = useState<{ option: string; odds: number; payout: string } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!id) return;

    async function load() {
      const [marketRes, optionsRes] = await Promise.all([
        supabase.from("markets").select("*").eq("id", id).single(),
        supabase.from("market_options").select("*").eq("market_id", id).order("sort_order"),
      ]);

      if (!marketRes.error && marketRes.data) {
        setMarket(marketRes.data as MarketData);
      }
      if (!optionsRes.error && optionsRes.data) {
        setOptions(optionsRes.data as MarketOption[]);
      }
      setLoading(false);
    }
    load();

    // Realtime
    const channel = supabase
      .channel(`market-detail-${id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "markets", filter: `id=eq.${id}` },
        (payload) => setMarket((prev) => prev ? { ...prev, ...payload.new } as MarketData : null))
      .on("postgres_changes", { event: "*", schema: "public", table: "market_options", filter: `market_id=eq.${id}` },
        () => {
          supabase.from("market_options").select("*").eq("market_id", id!).order("sort_order")
            .then(({ data }) => { if (data) setOptions(data as MarketOption[]); });
        })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [id]);

  const handleOptionClick = (name: string, odds: number) => {
    setBetModal({ option: name, odds, payout: `${(100 / odds).toFixed(2)}x` });
  };

  const handleCopyEmbed = () => {
    const baseUrl = window.location.origin;
    const code = `<iframe src="${baseUrl}/embed/${id}" width="100%" height="200" frameborder="0" style="border:none;border-radius:12px;"></iframe>`;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-8 flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  if (!market) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-8 text-center">
          <p className="text-muted-foreground">Market not found.</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate("/markets")}>
            Back to Markets
          </Button>
        </main>
      </div>
    );
  }

  const isMulti = market.market_type === "multi" && options.length > 0;
  const endDate = new Date(market.end_date);
  const daysLeft = Math.max(0, Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8">
        {/* Back button */}
        <button
          onClick={() => navigate("/markets")}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Markets
        </button>

        <div className="grid lg:grid-cols-[1fr,380px] gap-8">
          {/* Main content */}
          <div className="space-y-6">
            {/* Header */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[10px] font-bold tracking-widest uppercase text-primary bg-primary/10 px-2.5 py-0.5 rounded-full">
                  {market.category}
                </span>
                <span className={`text-[10px] font-bold tracking-widest uppercase px-2.5 py-0.5 rounded-full ${
                  market.status === "active" ? "text-success bg-success/10" : "text-muted-foreground bg-secondary"
                }`}>
                  {market.status}
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground leading-tight mb-3">
                {market.question}
              </h1>
              {market.description && (
                <p className="text-muted-foreground">{market.description}</p>
              )}
            </div>

            {/* Stats row */}
            <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4" /> {formatVolume(market.volume)} volume
              </span>
              <span className="flex items-center gap-1.5">
                <Users className="w-4 h-4" /> {market.total_traders.toLocaleString()} traders
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" /> {daysLeft} days left
              </span>
              <span className="flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4" /> {market.embed_views.toLocaleString()} embed views
              </span>
            </div>

            {/* Odds Chart */}
            <div className="premium-card p-6">
              <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                Price History
              </h2>
              <OddsChart marketId={market.id} height={280} />
            </div>

            {/* Embed section */}
            <div className="premium-card p-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-foreground flex items-center gap-2">
                  <Share2 className="w-4 h-4 text-primary" />
                  Embed this market
                </h2>
                <Button variant="outline" size="sm" className="rounded-full text-xs" onClick={handleCopyEmbed}>
                  {copied ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
                  {copied ? "Copied!" : "Copy Code"}
                </Button>
              </div>
              <div className="bg-secondary rounded-lg p-3 font-mono text-xs text-muted-foreground break-all">
                {`<iframe src="${window.location.origin}/embed/${id}" width="100%" height="200" frameborder="0"></iframe>`}
              </div>
            </div>
          </div>

          {/* Sidebar: Trading panel */}
          <div className="space-y-4">
            <div className="premium-card p-6 sticky top-24">
              <h2 className="font-semibold text-foreground mb-4">
                {isMulti ? "Choose an outcome" : "Make your prediction"}
              </h2>

              {isMulti ? (
                <div className="space-y-2">
                  {options.map((opt, i) => (
                    <button
                      key={opt.id}
                      onClick={() => handleOptionClick(opt.name, opt.odds)}
                      className="w-full flex items-center justify-between p-3.5 rounded-xl border border-border hover:border-primary/30 hover:bg-primary/5 transition-all duration-200 group"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center text-xs font-bold text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                          {i + 1}
                        </span>
                        <span className="font-medium text-foreground text-sm">{opt.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        {/* Odds bar */}
                        <div className="w-20 h-1.5 rounded-full bg-secondary overflow-hidden">
                          <div
                            className="h-full rounded-full bg-primary/60"
                            style={{ width: `${opt.odds}%` }}
                          />
                        </div>
                        <span className="text-sm font-semibold text-primary min-w-[40px] text-right">
                          {opt.odds.toFixed(0)}%
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Binary odds display */}
                  <div className="flex gap-2 mb-4">
                    <div className="flex-1 text-center p-4 rounded-xl bg-success/5 border border-success/20">
                      <div className="text-2xl font-bold text-success">{Math.round(market.yes_odds)}%</div>
                      <div className="text-xs text-muted-foreground mt-1">Yes</div>
                    </div>
                    <div className="flex-1 text-center p-4 rounded-xl bg-destructive/5 border border-destructive/20">
                      <div className="text-2xl font-bold text-destructive">{Math.round(market.no_odds)}%</div>
                      <div className="text-xs text-muted-foreground mt-1">No</div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="odds"
                      className="flex-1 h-12 text-base font-semibold hover:bg-success/10 hover:text-success hover:border-success/30 border"
                      onClick={() => handleOptionClick("Yes", market.yes_odds)}
                    >
                      Buy Yes
                    </Button>
                    <Button
                      variant="odds"
                      className="flex-1 h-12 text-base font-semibold hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 border"
                      onClick={() => handleOptionClick("No", market.no_odds)}
                    >
                      Buy No
                    </Button>
                  </div>
                </div>
              )}

              <div className="mt-5 pt-4 border-t border-border">
                <div className="flex justify-between text-xs text-muted-foreground mb-2">
                  <span>Resolution date</span>
                  <span className="text-foreground font-medium">
                    {endDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Market type</span>
                  <span className="text-foreground font-medium capitalize">{market.market_type}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />

      {betModal && (
        <BetModal
          open={!!betModal}
          onClose={() => setBetModal(null)}
          marketId={market.id}
          question={market.question}
          option={betModal.option}
          odds={betModal.odds}
          payout={betModal.payout}
        />
      )}
    </div>
  );
}
