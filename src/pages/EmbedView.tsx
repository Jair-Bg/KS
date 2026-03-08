import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MarketData {
  id: string;
  question: string;
  yes_odds: number;
  no_odds: number;
  volume: number;
  status: string;
}

export default function EmbedView() {
  const { id } = useParams<{ id: string }>();
  const [market, setMarket] = useState<MarketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<"yes" | "no" | null>(null);

  useEffect(() => {
    if (!id) return;

    async function load() {
      const { data, error } = await supabase
        .from("markets")
        .select("id, question, yes_odds, no_odds, volume, status")
        .eq("id", id)
        .single();

      if (!error && data) {
        setMarket(data as MarketData);
      }
      setLoading(false);
    }
    load();

    // Subscribe to realtime updates
    const channel = supabase
      .channel(`market-${id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "markets", filter: `id=eq.${id}` },
        (payload) => {
          setMarket((prev) => prev ? { ...prev, ...payload.new } as MarketData : null);
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

  const handleClick = (side: "yes" | "no") => {
    setSelected(side);
    // Open Kastia in a new tab for authenticated trading
    const origin = window.location.origin;
    window.open(`${origin}/markets?trade=${id}&side=${side}`, "_blank");
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
        <div className="flex gap-2">
          <Button
            variant={selected === "yes" ? "oddsActive" : "odds"}
            size="pill"
            className="flex-1"
            onClick={() => handleClick("yes")}
          >
            Yes {Math.round(market.yes_odds)}%
          </Button>
          <Button
            variant={selected === "no" ? "oddsActive" : "odds"}
            size="pill"
            className="flex-1"
            onClick={() => handleClick("no")}
          >
            No {Math.round(market.no_odds)}%
          </Button>
        </div>
        <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
          <span>{formatVol(market.volume)} vol</span>
          <a
            href={`${window.location.origin}/markets`}
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
