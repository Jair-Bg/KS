// API Service Layer — talks to Lovable Cloud (Supabase) directly.
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

export interface CreatorStats {
  totalEarnings: string;
  totalVolume: string;
  embedViews: string;
  activeMarkets: number;
}

export interface CreatorAnalytics {
  daily: { day: string; volume: number; bets: number }[];
  by_category: { category: string; volume: number; markets: number }[];
  top_markets: {
    id: string;
    question: string;
    category: string;
    volume: number;
    total_traders: number;
    embed_views: number;
    status: string;
  }[];
  totals: {
    unique_traders: number;
    total_bets: number;
    avg_bet: number;
    volume_period: number;
  };
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
      odds: Math.round(Number(o.odds)),
      payout: `${(100 / Math.max(Number(o.odds), 1)).toFixed(2)}x`,
    }));
  }
  const yes = Math.round(Number(market.yes_odds));
  const no = Math.round(Number(market.no_odds));
  return [
    { name: "Yes", odds: yes, payout: `${(100 / Math.max(yes, 1)).toFixed(2)}x` },
    { name: "No", odds: no, payout: `${(100 / Math.max(no, 1)).toFixed(2)}x` },
  ];
}

// ─── Markets ────────────────────────────────────────────────────
export async function fetchMarkets(category?: string, search?: string): Promise<Market[]> {
  let q = supabase
    .from("markets")
    .select("*")
    .eq("status", "active")
    .order("volume", { ascending: false })
    .limit(50);
  if (category && category !== "trending") q = q.eq("category", category);
  if (search) q = q.ilike("question", `%${search}%`);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as Market[];
}

export async function fetchMarket(id: string): Promise<Market | null> {
  const { data, error } = await supabase.from("markets").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return (data as Market) ?? null;
}

export async function searchMarkets(query: string): Promise<Market[]> {
  return fetchMarkets(undefined, query);
}

export async function createMarket(payload: {
  question: string;
  description?: string;
  category: string;
  market_type?: string;
  end_date: string;
  options?: string[];
}): Promise<Market> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("You must be signed in to create a market");
  const { data, error } = await supabase
    .from("markets")
    .insert({
      creator_id: user.id,
      question: payload.question,
      description: payload.description ?? null,
      category: payload.category,
      market_type: payload.market_type ?? "binary",
      end_date: payload.end_date,
      yes_odds: 50,
      no_odds: 50,
    })
    .select()
    .single();
  if (error) throw error;
  return data as Market;
}

// ─── Bets ───────────────────────────────────────────────────────
export async function placeBet(payload: {
  marketId: string;
  option: string;
  amount: number;
}): Promise<{ bet_id: string; odds: number; payout: number; new_yes_odds: number; new_no_odds: number }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Sign in to place a bet");
  const { data, error } = await supabase.rpc("place_bet", {
    p_market_id: payload.marketId,
    p_user_id: user.id,
    p_option: payload.option,
    p_amount: payload.amount,
  });
  if (error) throw error;
  return data as any;
}

export async function fetchUserBets(): Promise<Bet[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from("bets")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Bet[];
}

// ─── Creator ────────────────────────────────────────────────────
export async function fetchCreatorMarkets(): Promise<Market[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from("markets")
    .select("*")
    .eq("creator_id", user.id)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Market[];
}

export async function fetchCreatorStats(): Promise<CreatorStats> {
  const mine = await fetchCreatorMarkets();
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

// ─── Profile ────────────────────────────────────────────────────
export async function getProfileBalance(): Promise<number> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;
  const { data, error } = await supabase
    .from("profiles")
    .select("balance")
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) throw error;
  return Number(data?.balance ?? 0);
}

// ─── Watchlist ──────────────────────────────────────────────────
export async function fetchWatchlistIds(): Promise<Set<string>> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Set();
  const { data, error } = await supabase.from("watchlist").select("market_id").eq("user_id", user.id);
  if (error) throw error;
  return new Set((data ?? []).map((r: any) => r.market_id));
}

export async function fetchWatchlistMarkets(): Promise<Market[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from("watchlist")
    .select("market_id, markets(*)")
    .eq("user_id", user.id);
  if (error) throw error;
  return ((data ?? []).map((r: any) => r.markets).filter(Boolean)) as Market[];
}

export async function addToWatchlist(marketId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Sign in to use watchlist");
  const { error } = await supabase.from("watchlist").insert({ user_id: user.id, market_id: marketId });
  if (error && !String(error.message).includes("duplicate")) throw error;
}

export async function removeFromWatchlist(marketId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const { error } = await supabase
    .from("watchlist")
    .delete()
    .eq("user_id", user.id)
    .eq("market_id", marketId);
  if (error) throw error;
}

// ─── Categories ─────────────────────────────────────────────────
export async function fetchCategories(): Promise<string[]> {
  const { data, error } = await supabase
    .from("markets")
    .select("category")
    .eq("status", "active");
  if (error) throw error;
  const cats = [...new Set((data ?? []).map((r: any) => r.category).filter(Boolean))];
  return cats.sort();
}
