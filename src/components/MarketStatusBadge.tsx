import { CheckCircle2, Clock, Radio } from "lucide-react";
import { getMarketState, type MarketLike } from "@/lib/marketStatus";

interface Props {
  market: MarketLike;
  /** Hide the badge when the market is still active */
  hideWhenActive?: boolean;
  className?: string;
  size?: "sm" | "md";
}

export function MarketStatusBadge({ market, hideWhenActive, className = "", size = "md" }: Props) {
  const info = getMarketState(market);
  if (hideWhenActive && info.state === "active") return null;

  const tone =
    info.state === "settled"
      ? "bg-success/15 text-success border-success/30"
      : info.state === "expired"
        ? "bg-muted text-muted-foreground border-border"
        : "bg-primary/10 text-primary border-primary/30";

  const Icon = info.state === "settled" ? CheckCircle2 : info.state === "expired" ? Clock : Radio;
  const sizing = size === "sm" ? "text-[10px] px-2 py-0.5 gap-1" : "text-xs px-2.5 py-1 gap-1.5";

  return (
    <span
      className={`inline-flex items-center rounded-full border font-semibold uppercase tracking-wide ${tone} ${sizing} ${className}`}
    >
      <Icon className={size === "sm" ? "w-2.5 h-2.5" : "w-3 h-3"} />
      {info.label}
    </span>
  );
}
