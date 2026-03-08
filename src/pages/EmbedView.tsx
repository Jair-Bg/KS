import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MarketData {
  id: string;
  question: string;
  market_type: string;
  yes_odds: number;
  no_odds: number;
  volume: number;
  status: string;
}

interface MarketOption {
  id: string;
  name: string;
  odds: number;
  sort_order: number;
}

export default function EmbedView() {
  const { id } = useParams<{ id: string }>();
  const [market, setMarket] = useState<MarketData | null>(null);
  const [options, setOptions] = useState<MarketOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    async function load() {
      const [marketRes, optionsRes] = await Promise.all([
        supabase
          .from("markets")
          .select("id, question, market_type, yes_odds, no_odds, volume, status")
          .eq("id", id)
          .single(),
        supabase
          .from("market_options")
          .select("*")
          .eq("market_id", id)
          .order("sort_order"),
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

    // Subscribe to realtime updates
    const channel = supabase
      .channel(`embed-${id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "markets", filter: `id=eq.${id}` },
        (payload) => {
          setMarket((prev) => prev ? { ...prev, ...payload.new } as MarketData : null);
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "market_options", filter: `market_id=eq.${id}` },
        () => {
          supabase.from("market_options").select("*").eq("market_id", id!).order("sort_order")
            .then(({ data }) => { if (data) setOptions(data as MarketOption[]); });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [id]);

  const formatVol = (v: number) => {
    if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
    return `$${v.toFixed(0)}`;
  };

  const handleClick = (optionName: string) => {
    setSelected(optionName);
    const origin = window.location.origin;
    window.open(`${origin}/market/${id}`, "_blank");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </div>
    );
  }

  if (!market) {
    return (
      <div className="p-4 text-center text-sm text-muted-foreground">
        Market not found
      </div>
    );
  }

  const isMulti = market.market_type === "multi" && options.length > 0;

  return (
    <div className="bg-transparent p-2">
      <div className="rounded-xl border border-primary/20 bg-card overflow-hidden p-4">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-primary" />
          <span className="text-xs font-semibold text-primary uppercase tracking-wider">Kastia</span>
        </div>
        <p className="font-semibold text-foreground text-sm mb-3 leading-tight">
          {market.question}
        </p>

        {isMulti ? (
          <div className="space-y-1.5">
            {options.slice(0, 4).map((opt) => (
              <button
                key={opt.id}
                onClick={() => handleClick(opt.name)}
                className={`w-full flex items-center justify-between p-2.5 rounded-lg border transition-all duration-200 text-xs ${
                  selected === opt.name
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/30 hover:bg-primary/5"
                }`}
              >
                <span className="font-medium text-foreground truncate">{opt.name}</span>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="w-12 h-1 rounded-full bg-secondary overflow-hidden">
                    <div className="h-full rounded-full bg-primary/60" style={{ width: `${opt.odds}%` }} />
                  </div>
                  <span className="text-primary font-semibold min-w-[32px] text-right">{opt.odds.toFixed(0)}%</span>
                </div>
              </button>
            ))}
            {options.length > 4 && (
              <p className="text-[10px] text-muted-foreground text-center pt-1">
                +{options.length - 4} more outcomes
              </p>
            )}
          </div>
        ) : (
          <div className="flex gap-2">
            <Button
              variant={selected === "yes" ? "oddsActive" : "odds"}
              size="pill"
              className="flex-1"
              onClick={() => handleClick("Yes")}
            >
              Yes {Math.round(market.yes_odds)}%
            </Button>
            <Button
              variant={selected === "no" ? "oddsActive" : "odds"}
              size="pill"
              className="flex-1"
              onClick={() => handleClick("No")}
            >
              No {Math.round(market.no_odds)}%
            </Button>
          </div>
        )}

        <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
          <span>{formatVol(market.volume)} vol</span>
          <a
            href={`${window.location.origin}/market/${id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            Trade on Kastia →
          </a>
        </div>
      </div>
    </div>
  );
}
