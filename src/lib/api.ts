// API Service Layer — connected to real backend
import { supabase } from "@/integrations/supabase/client";

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

// ─── Helper: format volume ──────────────────────────────────────
export function formatVolume(vol: number): string {
  if (vol >= 1_000_000) return `$${(vol / 1_000_000).toFixed(1)}M`;
  if (vol >= 1_000) return `$${(vol / 1_000).toFixed(0)}K`;
  return `$${vol.toFixed(0)}`;
}

// ─── Helper: market to legacy option format ─────────────────────
export function marketToOptions(market: Market): MarketOption[] {
  return [
    { name: "Yes", odds: Math.round(market.yes_odds), payout: `${(100 / market.yes_odds).toFixed(2)}x` },
    { name: "No", odds: Math.round(market.no_odds), payout: `${(100 / market.no_odds).toFixed(2)}x` },
  ];
}

// ─── Markets ────────────────────────────────────────────────────
export async function fetchMarkets(category?: string, search?: string): Promise<Market[]> {
  let query = supabase
    .from("markets")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(50);

  if (category && category !== "trending") {
    query = query.eq("category", category);
  }
  if (search) {
    query = query.ilike("question", `%${search}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data as Market[]) || [];
}

export async function fetchMarket(id: string): Promise<Market | null> {
  const { data, error } = await supabase
    .from("markets")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return null;
  return data as Market;
}

export async function createMarket(data: {
  question: string;
  description?: string;
  category: string;
  market_type?: string;
  end_date: string;
}): Promise<Market> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Not authenticated");

  const { data: market, error } = await supabase
    .from("markets")
    .insert({
      creator_id: session.user.id,
      question: data.question,
      description: data.description || null,
      category: data.category,
      market_type: data.market_type || "binary",
      end_date: data.end_date,
      yes_odds: 50,
      no_odds: 50,
    })
    .select()
    .single();

  if (error) throw error;
  return market as Market;
}

export async function searchMarkets(query: string): Promise<Market[]> {
  return fetchMarkets(undefined, query);
}

// ─── Betting ────────────────────────────────────────────────────
export async function placeBet(data: {
  marketId: string;
  option: string;
  amount: number;
}): Promise<{ bet_id: string; odds: number; payout: number; new_yes_odds: number; new_no_odds: number }> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Not authenticated");

  const { data: result, error } = await supabase.rpc("place_bet", {
    p_market_id: data.marketId,
    p_user_id: session.user.id,
    p_option: data.option,
    p_amount: data.amount,
  });

  if (error) throw error;
  return result as any;
}

export async function fetchUserBets(): Promise<Bet[]> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return [];

  const { data, error } = await supabase
    .from("bets")
    .select("*")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data as Bet[]) || [];
}

// ─── Creator Dashboard ──────────────────────────────────────────
export async function fetchCreatorStats(): Promise<CreatorStats> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Not authenticated");

  const { data: markets, error } = await supabase
    .from("markets")
    .select("*")
    .eq("creator_id", session.user.id);

  if (error) throw error;

  const allMarkets = (markets as Market[]) || [];
  const totalVolume = allMarkets.reduce((sum, m) => sum + (m.volume || 0), 0);
  const totalViews = allMarkets.reduce((sum, m) => sum + (m.embed_views || 0), 0);
  const activeCount = allMarkets.filter((m) => m.status === "active").length;
  // Earnings estimate: 10% of volume
  const earnings = totalVolume * 0.1;

  return {
    totalEarnings: formatVolume(earnings),
    totalVolume: formatVolume(totalVolume),
    embedViews: totalViews >= 1000 ? `${(totalViews / 1000).toFixed(1)}K` : String(totalViews),
    activeMarkets: activeCount,
  };
}

export async function fetchCreatorMarkets(): Promise<Market[]> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return [];

  const { data, error } = await supabase
    .from("markets")
    .select("*")
    .eq("creator_id", session.user.id)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data as Market[]) || [];
}

// ─── Wallet (now uses profile balance) ──────────────────────────
export async function getProfileBalance(): Promise<number> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return 0;

  const { data, error } = await supabase
    .from("profiles")
    .select("balance")
    .eq("user_id", session.user.id)
    .single();

  if (error) return 0;
  return data?.balance || 0;
}
