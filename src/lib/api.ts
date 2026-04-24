// API Service Layer — talks to Supabase tables (markets, bets, profiles).
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
  let q = supabase
    .from("markets")
    .select("*, options:market_options(*)")
    .eq("status", "active")
    .order("volume", { ascending: false })
    .limit(100);

  if (category && category !== "trending") q = q.eq("category", category);
  if (search) q = q.ilike("question", `%${search}%`);

  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as unknown as Market[];
}

export async function fetchMarket(id: string): Promise<Market | null> {
  const { data, error } = await supabase
    .from("markets")
    .select("*, options:market_options(*)")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data as unknown as Market) ?? null;
}

export async function createMarket(payload: {
  question: string;
  description?: string;
  category: string;
  market_type?: string;
  end_date: string;
  options?: string[];
}): Promise<Market> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("You must be signed in to create a market");

  const { data, error } = await supabase
    .from("markets")
    .insert({
      creator_id: userData.user.id,
      question: payload.question,
      description: payload.description ?? null,
      category: payload.category,
      market_type: payload.market_type ?? "binary",
      end_date: payload.end_date,
    })
    .select()
    .single();
  if (error) throw error;

  if (payload.market_type === "multi" && payload.options?.length) {
    const optionRows = payload.options.map((name, i) => ({
      market_id: data.id,
      name,
      odds: Math.round(100 / payload.options!.length),
      sort_order: i,
    }));
    await supabase.from("market_options").insert(optionRows);
  }

  return data as unknown as Market;
}

export async function searchMarkets(query: string): Promise<Market[]> {
  return fetchMarkets(undefined, query);
}

export async function placeBet(payload: {
  marketId: string;
  option: string;
  amount: number;
}): Promise<{ bet_id: string; odds: number; payout: number; new_yes_odds: number; new_no_odds: number }> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("You must be signed in to place a bet");

  const { data, error } = await supabase.rpc("place_bet", {
    p_market_id: payload.marketId,
    p_user_id: userData.user.id,
    p_option: payload.option,
    p_amount: payload.amount,
  });
  if (error) throw new Error(error.message);
  return data as { bet_id: string; odds: number; payout: number; new_yes_odds: number; new_no_odds: number };
}

export async function fetchUserBets(): Promise<Bet[]> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return [];
  const { data, error } = await supabase
    .from("bets")
    .select("*")
    .eq("user_id", userData.user.id)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as Bet[];
}

export async function fetchCreatorStats(): Promise<CreatorStats> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { totalEarnings: "$0", totalVolume: "$0", embedViews: "0", activeMarkets: 0 };
  const { data: markets } = await supabase
    .from("markets")
    .select("volume, embed_views, status")
    .eq("creator_id", userData.user.id);
  const list = markets ?? [];
  const totalVolume = list.reduce((s, m) => s + Number(m.volume ?? 0), 0);
  const embedViews = list.reduce((s, m) => s + Number(m.embed_views ?? 0), 0);
  const active = list.filter((m) => m.status === "active").length;
  return {
    totalEarnings: formatVolume(totalVolume * 0.05),
    totalVolume: formatVolume(totalVolume),
    embedViews: embedViews.toLocaleString(),
    activeMarkets: active,
  };
}

export async function fetchCreatorMarkets(): Promise<Market[]> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return [];
  const { data, error } = await supabase
    .from("markets")
    .select("*, options:market_options(*)")
    .eq("creator_id", userData.user.id)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as Market[];
}

export async function getProfileBalance(): Promise<number> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return 0;
  const { data } = await supabase.from("profiles").select("balance").eq("user_id", userData.user.id).maybeSingle();
  return Number(data?.balance ?? 0);
}
