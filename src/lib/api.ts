// API Service Layer — backend tables were removed; returning stub/empty data.
// TODO: Re-create database schema or wire up on-chain data source.

// ─── Types ───────────────────────────────────────────────────────
export interface Market {
  id: string;
  creator_id: string;
  question: string;
  description: string | null;
  category: string;
  market_type: string;
  status: string;
  resolution: string | null;
  yes_odds: number;
  no_odds: number;
  volume: number;
  total_traders: number;
  embed_views: number;
  end_date: string;
  created_at: string;
  updated_at: string;
  options?: MarketOptionRow[];
}

export interface MarketOptionRow {
  id: string;
  market_id: string;
  name: string;
  odds: number;
  sort_order: number;
}

export interface MarketOption {
  name: string;
  odds: number;
  payout: string;
  icon?: string;
}

export interface Bet {
  id: string;
  market_id: string;
  user_id: string;
  option: string;
  option_id: string | null;
  amount: number;
  odds_at_time: number;
  potential_payout: number;
  status: string;
  created_at: string;
}

export interface UserProfile {
  id: string;
  user_id: string;
  display_name: string | null;
  balance: number | null;
  total_bets: number | null;
  total_winnings: number | null;
  created_markets: number | null;
  avatar_url: string | null;
  bio: string | null;
}

export interface CreatorStats {
  totalEarnings: string;
  totalVolume: string;
  embedViews: string;
  activeMarkets: number;
}

export interface EmbedConfig {
  marketId: string;
  format: "iframe" | "script" | "link";
  size: "compact" | "standard" | "large";
  width: string;
  height: string;
}

export function formatVolume(vol: number): string {
  if (vol >= 1_000_000) return `$${(vol / 1_000_000).toFixed(1)}M`;
  if (vol >= 1_000) return `$${(vol / 1_000).toFixed(0)}K`;
  return `$${vol.toFixed(0)}`;
}

export function marketToOptions(market: Market): MarketOption[] {
  if (market.market_type === "multi" && market.options && market.options.length > 0) {
    return market.options.map((o) => ({
      name: o.name,
      odds: Math.round(o.odds),
      payout: `${(100 / o.odds).toFixed(2)}x`,
    }));
  }
  return [
    { name: "Yes", odds: Math.round(market.yes_odds), payout: `${(100 / market.yes_odds).toFixed(2)}x` },
    { name: "No", odds: Math.round(market.no_odds), payout: `${(100 / market.no_odds).toFixed(2)}x` },
  ];
}

// ─── Stubs (DB tables were removed) ─────────────────────────────
export async function fetchMarkets(_category?: string, _search?: string): Promise<Market[]> {
  return [];
}

export async function fetchMarket(_id: string): Promise<Market | null> {
  return null;
}

export async function createMarket(_data: {
  question: string;
  description?: string;
  category: string;
  market_type?: string;
  end_date: string;
  options?: string[];
}): Promise<Market> {
  throw new Error("Markets backend not configured");
}

export async function searchMarkets(query: string): Promise<Market[]> {
  return fetchMarkets(undefined, query);
}

export async function placeBet(_data: {
  marketId: string;
  option: string;
  amount: number;
}): Promise<{ bet_id: string; odds: number; payout: number; new_yes_odds: number; new_no_odds: number }> {
  throw new Error("Betting backend not configured");
}

export async function fetchUserBets(): Promise<Bet[]> {
  return [];
}

export async function fetchCreatorStats(): Promise<CreatorStats> {
  return { totalEarnings: "$0", totalVolume: "$0", embedViews: "0", activeMarkets: 0 };
}

export async function fetchCreatorMarkets(): Promise<Market[]> {
  return [];
}

export async function getProfileBalance(): Promise<number> {
  return 0;
}
