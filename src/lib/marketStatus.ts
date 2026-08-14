// Shared market lifecycle state used across cards, detail, embeds and dashboards.

export type MarketState = "active" | "expired" | "settled";

export interface MarketLike {
  status?: string | null;
  resolution?: string | null;
  end_date?: string | null;
}

export interface MarketStateInfo {
  state: MarketState;
  /** Short label for badges, e.g. "Settled · Yes" */
  label: string;
  /** Longer explanation for banners */
  description: string;
  /** Trading allowed? */
  tradable: boolean;
  resolution: string | null;
}

export function getMarketState(market: MarketLike): MarketStateInfo {
  const resolution = market.resolution ?? null;
  const status = (market.status ?? "active").toLowerCase();
  const ended = market.end_date ? new Date(market.end_date).getTime() <= Date.now() : false;

  if (status === "resolved" || status === "settled") {
    return {
      state: "settled",
      label: resolution ? `Settled · ${resolution}` : "Settled",
      description: resolution
        ? `This market settled with outcome ${resolution}. Winning positions were paid out automatically.`
        : "This market has been settled and trading is closed.",
      tradable: false,
      resolution,
    };
  }

  if (ended || status === "closed") {
    return {
      state: "expired",
      label: "Expired",
      description: "The deadline has passed. This market is awaiting automatic settlement.",
      tradable: false,
      resolution,
    };
  }

  return {
    state: "active",
    label: "Active",
    description: "Trading is open.",
    tradable: true,
    resolution,
  };
}

export function isMarketTradable(market: MarketLike): boolean {
  return getMarketState(market).tradable;
}

/** True when the market should be hidden from browse/search listings. */
export function isMarketListable(market: MarketLike): boolean {
  return getMarketState(market).state === "active";
}
