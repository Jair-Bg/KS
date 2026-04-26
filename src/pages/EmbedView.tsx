import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { fetchMarket, marketToOptions, formatVolume, type Market } from "@/lib/api";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, Users, ExternalLink, Loader2 } from "lucide-react";

export default function EmbedView() {
  const { id } = useParams<{ id: string }>();
  const [params] = useSearchParams();
  const compact = params.get("compact") === "true";
  const [market, setMarket] = useState<Market | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        const m = await fetchMarket(id);
        if (cancelled) return;
        if (!m) { setError("Market not found"); return; }
        setMarket(m);
        // Increment embed view counter (fire and forget)
        await supabase
          .from("markets")
          .update({ embed_views: (m.embed_views ?? 0) + 1 })
          .eq("id", id);
      } catch (e) {
        if (!cancelled) setError("Failed to load market");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  const tradeUrl = `${window.location.origin}/market/${id}?ref=embed`;

  if (loading) {
    return (
      <div className="bg-transparent p-2">
        <div className="rounded-xl border border-border bg-card p-4 flex items-center justify-center min-h-[120px]">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (error || !market) {
    return (
      <div className="bg-transparent p-2">
        <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground text-center">
          {error || "Market unavailable"}
        </div>
      </div>
    );
  }

  const options = marketToOptions(market);

  return (
    <div className="bg-transparent p-2 font-sans">
      <div className="rounded-xl border border-primary/20 bg-card overflow-hidden shadow-sm">
        {/* Header bar */}
        <div className="flex items-center justify-between px-3 py-2 bg-secondary/40 border-b border-border">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-primary tracking-wide">KASTIA</span>
            <span className="text-[9px] uppercase tracking-wider text-muted-foreground">Live Market</span>
          </div>
          <a
            href={tradeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-muted-foreground hover:text-primary inline-flex items-center gap-1"
          >
            Open <ExternalLink className="w-2.5 h-2.5" />
          </a>
        </div>

        {/* Question */}
        <div className={compact ? "px-3 pt-3" : "px-4 pt-4"}>
          <p className={`font-semibold text-foreground leading-snug ${compact ? "text-xs" : "text-sm"}`}>
            {market.question}
          </p>
        </div>

        {/* Odds bar */}
        <div className={`${compact ? "px-3 py-2.5" : "px-4 py-3"} space-y-2`}>
          <div className="flex h-2 rounded-full overflow-hidden bg-muted">
            {options.slice(0, 2).map((o, i) => (
              <div
                key={o.name}
                className={i === 0 ? "bg-primary" : "bg-muted-foreground/40"}
                style={{ width: `${o.odds}%` }}
              />
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            {options.slice(0, 2).map((o, i) => (
              <a
                key={o.name}
                href={`${tradeUrl}&pick=${encodeURIComponent(o.name)}`}
                target="_blank"
                rel="noopener noreferrer"
                className={`text-center rounded-lg py-2 text-xs font-semibold transition-colors ${
                  i === 0
                    ? "bg-primary/10 text-primary hover:bg-primary/20"
                    : "bg-secondary text-foreground hover:bg-muted"
                }`}
              >
                {o.name} {o.odds}%
              </a>
            ))}
          </div>
        </div>

        {/* Footer stats */}
        <div className="flex items-center justify-between px-3 py-2 border-t border-border bg-secondary/20 text-[10px] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> {formatVolume(market.volume)} vol
          </span>
          <span className="inline-flex items-center gap-1">
            <Users className="w-3 h-3" /> {market.total_traders} traders
          </span>
          <a
            href={tradeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary font-semibold hover:underline"
          >
            Trade →
          </a>
        </div>
      </div>
    </div>
  );
}
