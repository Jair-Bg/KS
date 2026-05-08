// Mock backend — fully in-browser, localStorage-backed.
// Powers markets, bets, balance, odds history, watchlist, and embeds
// so the demo works without any remote services.

export interface MockMarket {
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
  options?: { id: string; market_id: string; name: string; odds: number; sort_order: number }[];
}

export interface MockBet {
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

interface OddsPoint {
  market_id: string;
  yes_odds: number;
  no_odds: number;
  recorded_at: string;
}

const KEY = "kastia_mock_v1";
const USER_ID = "demo-user";
const STARTING_BALANCE = 1000;

interface Store {
  markets: MockMarket[];
  bets: MockBet[];
  odds: OddsPoint[];
  watchlist: string[];
  balance: number;
  totalBets: number;
}

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function seed(): Store {
  const now = Date.now();
  const day = 86_400_000;
  const mk = (
    question: string,
    category: string,
    yes: number,
    volume: number,
    traders: number,
    daysOut: number,
    description: string,
  ): MockMarket => {
    const id = uid();
    return {
      id,
      creator_id: "seed",
      question,
      description,
      category,
      market_type: "binary",
      status: "active",
      resolution: null,
      yes_odds: yes,
      no_odds: 100 - yes,
      volume,
      total_traders: traders,
      embed_views: Math.floor(volume / 4),
      end_date: new Date(now + daysOut * day).toISOString(),
      created_at: new Date(now - 14 * day).toISOString(),
      updated_at: new Date(now).toISOString(),
    };
  };

  const markets: MockMarket[] = [
    mk("Will Bitcoin close above $120K by end of month?", "crypto", 62, 482_000, 1240, 21,
      "Resolves YES if BTC/USD spot price on Coinbase closes above $120,000 on the final day of the month."),
    mk("Will the Lakers make the NBA playoffs this season?", "sports", 71, 318_500, 902, 45,
      "Resolves YES if the LA Lakers qualify for the 2026 NBA playoffs (top 10 West)."),
    mk("Will OpenAI release GPT-6 before July 2026?", "tech", 28, 256_700, 731, 60,
      "Resolves YES if OpenAI publicly announces a model branded GPT-6 with general availability before July 1, 2026."),
    mk("Will the Fed cut rates at the next FOMC meeting?", "politics", 44, 612_300, 1580, 14,
      "Resolves YES if the Federal Open Market Committee announces a target rate cut at its next meeting."),
    mk("Will Ethereum flip Bitcoin in market cap in 2026?", "crypto", 11, 198_400, 540, 220,
      "Resolves YES if ETH market cap exceeds BTC market cap on any day in 2026 (CoinGecko reference)."),
    mk("Will Taylor Swift announce a new album this quarter?", "entertainment", 38, 142_900, 410, 75,
      "Resolves YES upon official announcement of a new studio album by Taylor Swift."),
    mk("Will SpaceX successfully land Starship on the Moon by 2027?", "tech", 22, 374_600, 980, 365,
      "Resolves YES upon a successful soft landing of a SpaceX Starship vehicle on the lunar surface."),
  ];

  // Generate 30 days of odds history per market (gentle random walk toward current odds)
  const odds: OddsPoint[] = [];
  for (const m of markets) {
    let y = Math.max(15, Math.min(85, m.yes_odds + (Math.random() * 30 - 15)));
    for (let d = 30; d >= 0; d--) {
      const drift = (m.yes_odds - y) * 0.15;
      y = Math.max(5, Math.min(95, y + drift + (Math.random() * 6 - 3)));
      odds.push({
        market_id: m.id,
        yes_odds: Math.round(y),
        no_odds: 100 - Math.round(y),
        recorded_at: new Date(now - d * day).toISOString(),
      });
    }
  }

  return { markets, bets: [], odds, watchlist: [], balance: STARTING_BALANCE, totalBets: 0 };
}

function load(): Store {
  if (typeof window === "undefined") return seed();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      const fresh = seed();
      localStorage.setItem(KEY, JSON.stringify(fresh));
      return fresh;
    }
    return JSON.parse(raw) as Store;
  } catch {
    const fresh = seed();
    localStorage.setItem(KEY, JSON.stringify(fresh));
    return fresh;
  }
}

function save(s: Store) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(s));
  // notify other tabs / components
  window.dispatchEvent(new CustomEvent("kastia-mock-updated"));
}

let store: Store = load();

export const mockBackend = {
  reset() {
    store = seed();
    save(store);
  },
  getUserId() { return USER_ID; },
  getBalance() { return store.balance; },

  listMarkets(opts: { category?: string; search?: string } = {}): MockMarket[] {
    let list = [...store.markets].filter((m) => m.status === "active");
    if (opts.category && opts.category !== "trending") list = list.filter((m) => m.category === opts.category);
    if (opts.search) {
      const q = opts.search.toLowerCase();
      list = list.filter((m) => m.question.toLowerCase().includes(q));
    }
    list.sort((a, b) => b.volume - a.volume);
    return list;
  },

  getMarket(id: string): MockMarket | null {
    return store.markets.find((m) => m.id === id) ?? null;
  },

  recordEmbedView(id: string) {
    const m = store.markets.find((x) => x.id === id);
    if (!m) return;
    m.embed_views += 1;
    save(store);
  },

  getOddsHistory(marketId: string) {
    return store.odds
      .filter((p) => p.market_id === marketId)
      .sort((a, b) => +new Date(a.recorded_at) - +new Date(b.recorded_at));
  },

  getBets(): MockBet[] {
    return [...store.bets].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
  },

  createMarket(payload: {
    question: string;
    description?: string;
    category: string;
    market_type?: string;
    end_date: string;
  }): MockMarket {
    const now = new Date().toISOString();
    const m: MockMarket = {
      id: uid(),
      creator_id: USER_ID,
      question: payload.question,
      description: payload.description ?? null,
      category: payload.category,
      market_type: payload.market_type ?? "binary",
      status: "active",
      resolution: null,
      yes_odds: 50,
      no_odds: 50,
      volume: 0,
      total_traders: 0,
      embed_views: 0,
      end_date: payload.end_date,
      created_at: now,
      updated_at: now,
    };
    store.markets.unshift(m);
    store.odds.push({ market_id: m.id, yes_odds: 50, no_odds: 50, recorded_at: now });
    save(store);
    return m;
  },

  placeBet(payload: { marketId: string; option: string; amount: number }) {
    const m = store.markets.find((x) => x.id === payload.marketId);
    if (!m) throw new Error("Market not found");
    if (payload.amount <= 0) throw new Error("Amount must be greater than 0");
    if (payload.amount > store.balance) throw new Error("Insufficient balance");

    const isYes = payload.option.toLowerCase() === "yes";
    const odds = isYes ? m.yes_odds : m.no_odds;
    const payout = payload.amount * (100 / Math.max(odds, 1));

    // Move odds — bigger bets nudge harder. Cap per-trade move at 8%.
    const impact = Math.min(8, (payload.amount / Math.max(m.volume + payload.amount, 100)) * 100);
    if (isYes) {
      m.yes_odds = Math.min(95, Math.round(m.yes_odds + impact));
      m.no_odds = 100 - m.yes_odds;
    } else {
      m.no_odds = Math.min(95, Math.round(m.no_odds + impact));
      m.yes_odds = 100 - m.no_odds;
    }
    m.volume += payload.amount;
    m.total_traders += 1;
    m.updated_at = new Date().toISOString();

    const bet: MockBet = {
      id: uid(),
      market_id: m.id,
      user_id: USER_ID,
      option: payload.option,
      option_id: null,
      amount: payload.amount,
      odds_at_time: odds,
      potential_payout: payout,
      status: "pending",
      created_at: new Date().toISOString(),
    };
    store.bets.unshift(bet);
    store.balance -= payload.amount;
    store.totalBets += 1;

    store.odds.push({
      market_id: m.id,
      yes_odds: m.yes_odds,
      no_odds: m.no_odds,
      recorded_at: new Date().toISOString(),
    });

    save(store);
    return {
      bet_id: bet.id,
      odds,
      payout,
      new_yes_odds: m.yes_odds,
      new_no_odds: m.no_odds,
      new_balance: store.balance,
    };
  },

  watchlist: {
    ids(): Set<string> { return new Set(store.watchlist); },
    list(): MockMarket[] {
      return store.watchlist
        .map((id) => store.markets.find((m) => m.id === id))
        .filter(Boolean) as MockMarket[];
    },
    add(id: string) {
      if (!store.watchlist.includes(id)) {
        store.watchlist.push(id);
        save(store);
      }
    },
    remove(id: string) {
      store.watchlist = store.watchlist.filter((x) => x !== id);
      save(store);
    },
  },
};
