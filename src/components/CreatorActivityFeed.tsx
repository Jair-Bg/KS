import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, Clock, TrendingUp, Users, Eye, ArrowUpDown, CheckCircle2 as CheckIcon } from "lucide-react";
import { formatVolume, type Market } from "@/lib/api";
import { getMarketState } from "@/lib/marketStatus";
import { MarketStatusBadge } from "@/components/MarketStatusBadge";

/** Creator fee share applied to settled/expired market volume. */
const CREATOR_FEE_RATE = 0.05;

type EventFilter = "all" | "settled" | "expired";
type SortKey = "newest" | "impact";

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export interface CreatorActivityFeedProps {
  markets: Market[];
  loading?: boolean;
}

export function CreatorActivityFeed({ markets, loading }: CreatorActivityFeedProps) {
  const [filter, setFilter] = useState<EventFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("newest");

  const allEvents = useMemo(() => {
    return markets
      .map((m) => ({ market: m, info: getMarketState(m) }))
      .filter((e) => e.info.state !== "active")
      .map((e) => {
        const volume = Number(e.market.volume ?? 0);
        return {
          ...e,
          volume,
          earnings: volume * CREATOR_FEE_RATE,
          at: e.info.state === "settled" ? e.market.updated_at : e.market.end_date,
        };
      })
      .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  }, [markets]);

  const events = useMemo(() => {
    const filtered =
      filter === "all" ? allEvents : allEvents.filter((e) => e.info.state === filter);
    if (sortKey === "newest") {
      return [...filtered].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
    }
    // highest impact = greatest earnings (volume × fee rate)
    return [...filtered].sort((a, b) => b.earnings - a.earnings);
  }, [allEvents, filter, sortKey]);

  const totals = useMemo(
    () => ({
      volume: allEvents.reduce((s, e) => s + e.volume, 0),
      earnings: allEvents.reduce((s, e) => s + e.earnings, 0),
      settled: allEvents.filter((e) => e.info.state === "settled").length,
      awaiting: allEvents.filter((e) => e.info.state === "expired").length,
    }),
    [allEvents]
  );

  return (
    <section className="bg-card rounded-xl border border-border overflow-hidden mb-8">
      <div className="px-6 py-4 border-b border-border flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-semibold text-foreground">Settlement Activity</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Markets that expired or settled, and their impact on your earnings.
          </p>
        </div>
        <div className="flex items-center gap-4 font-mono text-[11px]">
          <div className="flex flex-col">
            <span className="text-[9px] uppercase tracking-wider text-muted-foreground">Settled</span>
            <span className="text-foreground tabular-nums font-semibold">{totals.settled}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] uppercase tracking-wider text-muted-foreground">Awaiting</span>
            <span className="text-foreground tabular-nums font-semibold">{totals.awaiting}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] uppercase tracking-wider text-muted-foreground">Volume</span>
            <span className="text-foreground tabular-nums font-semibold">{formatVolume(totals.volume)}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] uppercase tracking-wider text-muted-foreground">Earnings</span>
            <span className="text-success tabular-nums font-semibold">{formatVolume(totals.earnings)}</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="px-6 py-10 text-center text-sm text-muted-foreground">Loading activity…</div>
      ) : events.length === 0 ? (
        <div className="px-6 py-10 text-center text-sm text-muted-foreground">
          No markets have expired or settled yet. Activity will appear here after a deadline passes.
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {events.map(({ market, info, volume, earnings, at }) => (
            <li key={market.id} className="px-6 py-4 hover:bg-secondary/50 transition-colors">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span
                      className={
                        info.state === "settled"
                          ? "text-success flex items-center"
                          : "text-muted-foreground flex items-center"
                      }
                    >
                      {info.state === "settled" ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <Clock className="w-4 h-4" />
                      )}
                    </span>
                    <Link
                      to={`/market/${market.id}`}
                      className="font-medium text-foreground text-sm truncate hover:underline"
                    >
                      {market.question}
                    </Link>
                    <MarketStatusBadge market={market} />
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                    <span className="capitalize">{market.category}</span>
                    <span className="inline-flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" /> {Number(market.total_traders ?? 0).toLocaleString()} traders
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" /> {Number(market.embed_views ?? 0).toLocaleString()} embed views
                    </span>
                    <span>{timeAgo(at)}</span>
                  </div>
                </div>
                <div className="text-right font-mono">
                  <div className="text-sm font-semibold text-foreground tabular-nums inline-flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5 text-primary" />
                    {formatVolume(volume)}
                  </div>
                  <div className="text-xs text-success tabular-nums">
                    +{formatVolume(earnings)} earned
                  </div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">
                    {info.state === "settled" ? info.label : "Awaiting settlement"}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
