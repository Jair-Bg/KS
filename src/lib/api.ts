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
  engine?: "amm" | "clob";
  options?: MarketOptionRow[];
}

// ─── CLOB Types ─────────────────────────────────────────────────
export interface OrderRow {
  id: string;
  market_id: string;
  user_id: string;
  side: "BUY" | "SELL";
  contract: "YES" | "NO";
  price: number;
  quantity: number;
  filled: number;
  status: "open" | "filled" | "cancelled";
  is_mm: boolean;
  created_at: string;
}
export interface TradeRow {
  id: string;
  market_id: string;
  contract: string | null;
  price: number;
  quantity: number;
  mint: boolean;
  created_at: string;
}
export interface PositionRow {
  user_id: string;
  market_id: string;
  yes_qty: number;
  no_qty: number;
}
export interface MMQuoteResponse {
  event_id: string;
  timestamp: number;
  mid: number;
  spread: number;
  skew: number;
  market_maker_orders: Array<{
    side: "BUY" | "SELL";
    contract: "YES" | "NO";
    order_type: "LIMIT";
    price: number;
    quantity_contracts: number;
  }>;
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
  engine?: "amm" | "clob";
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
      engine: payload.engine ?? "amm",
    } as any)
    .select()
    .single();
  if (error) throw error;
  return data as Market;
}

// ─── CLOB ───────────────────────────────────────────────────────
export async function placeLimitOrder(payload: {
  marketId: string;
  side: "BUY" | "SELL";
  contract: "YES" | "NO";
  price: number;
  quantity: number;
}): Promise<{ order_id: string }> {
  const { data, error } = await supabase.rpc("place_limit_order", {
    p_market_id: payload.marketId,
    p_side: payload.side,
    p_contract: payload.contract,
    p_price: payload.price,
    p_quantity: payload.quantity,
  } as any);
  if (error) throw error;
  return data as any;
}

export async function cancelOrder(orderId: string): Promise<void> {
  const { error } = await supabase.rpc("cancel_order", { p_order_id: orderId } as any);
  if (error) throw error;
}

export async function fetchOrderBook(marketId: string): Promise<OrderRow[]> {
  const { data, error } = await supabase
    .from("orders" as any)
    .select("*")
    .eq("market_id", marketId)
    .eq("status", "open")
    .order("price", { ascending: false })
    .limit(500);
  if (error) throw error;
  return (data ?? []) as unknown as OrderRow[];
}

export async function fetchMyOrders(marketId: string): Promise<OrderRow[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from("orders" as any)
    .select("*")
    .eq("market_id", marketId)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as OrderRow[];
}

export async function fetchMyPosition(marketId: string): Promise<PositionRow | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase
    .from("positions" as any)
    .select("*")
    .eq("market_id", marketId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) throw error;
  return (data as any) ?? null;
}

export async function fetchRecentTrades(marketId: string, limit = 30): Promise<TradeRow[]> {
  const { data, error } = await supabase
    .from("trades" as any)
    .select("*")
    .eq("market_id", marketId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as unknown as TradeRow[];
}

export async function mmGenerateQuotes(payload: {
  marketId: string;
  pModel: number;
  confidence: "high" | "low";
  quantity?: number;
}): Promise<MMQuoteResponse> {
  const { data, error } = await supabase.rpc("mm_generate_quotes", {
    p_market_id: payload.marketId,
    p_model: payload.pModel,
    p_confidence: payload.confidence,
    p_quantity: payload.quantity ?? 1000,
  } as any);
  if (error) throw error;
  return data as unknown as MMQuoteResponse;
}

export async function fetchMMInventory(marketId: string): Promise<{ yes_qty: number; no_qty: number; target_notional: number } | null> {
  const { data, error } = await supabase
    .from("mm_inventory" as any)
    .select("yes_qty,no_qty,target_notional")
    .eq("market_id", marketId)
    .maybeSingle();
  if (error) throw error;
  return (data as any) ?? null;
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


export async function fetchCreatorAnalytics(days: number = 30): Promise<CreatorAnalytics> {
  const { data, error } = await supabase.rpc("get_creator_analytics", { p_days: days });
  if (error) throw error;
  const d = (data ?? {}) as Partial<CreatorAnalytics>;
  return {
    daily: (d.daily ?? []).map((r: any) => ({ day: r.day, volume: Number(r.volume), bets: Number(r.bets) })),
    by_category: (d.by_category ?? []).map((r: any) => ({ category: r.category, volume: Number(r.volume), markets: Number(r.markets) })),
    top_markets: (d.top_markets ?? []).map((r: any) => ({ ...r, volume: Number(r.volume), total_traders: Number(r.total_traders), embed_views: Number(r.embed_views) })),
    totals: {
      unique_traders: Number(d.totals?.unique_traders ?? 0),
      total_bets: Number(d.totals?.total_bets ?? 0),
      avg_bet: Number(d.totals?.avg_bet ?? 0),
      volume_period: Number(d.totals?.volume_period ?? 0),
    },
  };
}

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
