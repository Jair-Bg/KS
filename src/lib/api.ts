// API Service Layer — fully mocked for demo (localStorage-backed).
// All reads/writes go through `mockBackend` so the app works without a remote.
import { mockBackend, type MockMarket } from "./mockBackend";

// ─── Types ───────────────────────────────────────────────────────
export type Market = MockMarket;

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
      payout: `${(100 / Math.max(o.odds, 1)).toFixed(2)}x`,
    }));
  }
  return [
    { name: "Yes", odds: Math.round(market.yes_odds), payout: `${(100 / Math.max(market.yes_odds, 1)).toFixed(2)}x` },
    { name: "No", odds: Math.round(market.no_odds), payout: `${(100 / Math.max(market.no_odds, 1)).toFixed(2)}x` },
  ];
}

// ─── Queries ────────────────────────────────────────────────────
export async function fetchMarkets(category?: string, search?: string): Promise<Market[]> {
  return mockBackend.listMarkets({ category, search });
}

export async function fetchMarket(id: string): Promise<Market | null> {
  return mockBackend.getMarket(id);
}

export async function createMarket(payload: {
  question: string;
  description?: string;
  category: string;
  market_type?: string;
  end_date: string;
  options?: string[];
}): Promise<Market> {
  return mockBackend.createMarket(payload);
}

export async function searchMarkets(query: string): Promise<Market[]> {
  return fetchMarkets(undefined, query);
}

export async function placeBet(payload: {
  marketId: string;
  option: string;
  amount: number;
}): Promise<{ bet_id: string; odds: number; payout: number; new_yes_odds: number; new_no_odds: number; new_balance: number }> {
  return mockBackend.placeBet(payload);
}

export async function fetchUserBets(): Promise<Bet[]> {
  return mockBackend.getBets();
}

export async function fetchCreatorStats(): Promise<CreatorStats> {
  const list = mockBackend.listMarkets();
  const mine = list.filter((m) => m.creator_id === mockBackend.getUserId());
  const totalVolume = mine.reduce((s, m) => s + Number(m.volume ?? 0), 0);
  const embedViews = mine.reduce((s, m) => s + Number(m.embed_views ?? 0), 0);
  const active = mine.filter((m) => m.status === "active").length;
  return {
    totalEarnings: formatVolume(totalVolume * 0.05),
    totalVolume: formatVolume(totalVolume),
    embedViews: embedViews.toLocaleString(),
    activeMarkets: active,
  };
}

export async function fetchCreatorMarkets(): Promise<Market[]> {
  return mockBackend.listMarkets().filter((m) => m.creator_id === mockBackend.getUserId());
}

export async function getProfileBalance(): Promise<number> {
  return mockBackend.getBalance();
}

// ─── Watchlist ──────────────────────────────────────────────────
export async function fetchWatchlistIds(): Promise<Set<string>> {
  return mockBackend.watchlist.ids();
}

export async function fetchWatchlistMarkets(): Promise<Market[]> {
  return mockBackend.watchlist.list();
}

export async function addToWatchlist(marketId: string): Promise<void> {
  mockBackend.watchlist.add(marketId);
}

export async function removeFromWatchlist(marketId: string): Promise<void> {
  mockBackend.watchlist.remove(marketId);
}
