// API Service Layer
// Currently uses mock data. Replace BASE_URL and remove mock responses 
// to connect to your external Python/Solidity backend.

const BASE_URL = import.meta.env.VITE_API_URL || "https://api.kastia.app";

// ─── Types ───────────────────────────────────────────────────────
export interface Market {
  id: string;
  question: string;
  type: "binary" | "multi";
  status: "active" | "resolved" | "cancelled";
  options: MarketOption[];
  volume: string;
  resolutionDate: string;
  createdAt: string;
  creatorId?: string;
  category: string;
  embedViews: number;
}

export interface MarketOption {
  name: string;
  odds: number;
  payout: string;
  icon?: string;
}

export interface Bet {
  id: string;
  marketId: string;
  userId: string;
  option: string;
  amount: number;
  odds: number;
  timestamp: string;
  status: "pending" | "won" | "lost" | "cancelled";
  txHash?: string;
}

export interface UserProfile {
  id: string;
  address: string;
  displayName: string;
  balance: number;
  totalBets: number;
  totalWinnings: number;
  createdMarkets: number;
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

// ─── Mock Data ───────────────────────────────────────────────────
const mockMarkets: Market[] = [
  {
    id: "abc123", question: "Bitcoin above $120k by June 2025?", type: "binary", status: "active",
    options: [{ name: "Yes", odds: 34, payout: "2.94x" }, { name: "No", odds: 66, payout: "1.52x" }],
    volume: "$2,400,000", resolutionDate: "2025-06-30", createdAt: "2025-01-20", category: "crypto", embedViews: 12400,
  },
  {
    id: "def456", question: "Kenya opposition wins 2027 presidential election?", type: "binary", status: "active",
    options: [{ name: "Yes", odds: 42, payout: "2.38x" }, { name: "No", odds: 58, payout: "1.72x" }],
    volume: "$180,000", resolutionDate: "2027-08-15", createdAt: "2025-01-15", category: "politics", embedViews: 8900,
  },
  {
    id: "ghi789", question: "Will Messi play in the 2026 World Cup?", type: "binary", status: "active",
    options: [{ name: "Yes", odds: 71, payout: "1.41x" }, { name: "No", odds: 29, payout: "3.45x" }],
    volume: "$1,100,000", resolutionDate: "2026-07-19", createdAt: "2025-01-10", category: "sports", embedViews: 18200,
  },
  {
    id: "live001", question: "Streamer reaches 10K viewers this session?", type: "binary", status: "active",
    options: [{ name: "Yes", odds: 55, payout: "1.82x" }, { name: "No", odds: 45, payout: "2.22x" }],
    volume: "$12,000", resolutionDate: "2025-02-01", createdAt: "2025-01-28", category: "culture", embedViews: 3200,
  },
  {
    id: "live002", question: "Will he rage-quit in the next 30 minutes?", type: "binary", status: "active",
    options: [{ name: "Yes", odds: 38, payout: "2.63x" }, { name: "No", odds: 62, payout: "1.61x" }],
    volume: "$8,500", resolutionDate: "2025-02-01", createdAt: "2025-01-28", category: "culture", embedViews: 2100,
  },
  {
    id: "fed001", question: "Fed cuts rates before July 2025?", type: "binary", status: "active",
    options: [{ name: "Yes", odds: 57, payout: "1.75x" }, { name: "No", odds: 43, payout: "2.33x" }],
    volume: "$7,600,000", resolutionDate: "2025-07-01", createdAt: "2025-01-05", category: "economics", embedViews: 15600,
  },
  {
    id: "gpt001", question: "GPT-5 released before July 2025?", type: "binary", status: "active",
    options: [{ name: "Yes", odds: 40, payout: "2.50x" }, { name: "No", odds: 60, payout: "1.67x" }],
    volume: "$4,800,000", resolutionDate: "2025-07-01", createdAt: "2025-01-12", category: "tech", embedViews: 9800,
  },
  {
    id: "tik001", question: "TikTok banned in US by mid-2025?", type: "binary", status: "active",
    options: [{ name: "Yes", odds: 21, payout: "4.76x" }, { name: "No", odds: 79, payout: "1.27x" }],
    volume: "$11,200,000", resolutionDate: "2025-06-30", createdAt: "2025-01-08", category: "companies", embedViews: 22100,
  },
];

let userBets: Bet[] = [];
let betIdCounter = 1;

// ─── Simulated wallet state ─────────────────────────────────────
let walletState: { connected: boolean; address: string; balance: number } = {
  connected: false,
  address: "",
  balance: 0,
};

// ─── API Functions ───────────────────────────────────────────────

/** Simulate network delay */
const delay = (ms = 400) => new Promise((r) => setTimeout(r, ms));

// Markets
export async function fetchMarkets(category?: string): Promise<Market[]> {
  await delay(300);
  if (category && category !== "trending") {
    return mockMarkets.filter((m) => m.category === category);
  }
  return mockMarkets;
}

export async function fetchMarket(id: string): Promise<Market | null> {
  await delay(200);
  return mockMarkets.find((m) => m.id === id) || null;
}

export async function createMarket(data: {
  question: string;
  type: "binary" | "multi";
  resolutionDate: string;
  options: string[];
  category: string;
}): Promise<Market> {
  await delay(600);
  const newMarket: Market = {
    id: `mkt_${Date.now()}`,
    question: data.question,
    type: data.type,
    status: "active",
    options: data.options.map((name, i) => ({
      name,
      odds: Math.round(100 / data.options.length),
      payout: `${(data.options.length).toFixed(2)}x`,
    })),
    volume: "$0",
    resolutionDate: data.resolutionDate,
    createdAt: new Date().toISOString(),
    category: data.category,
    embedViews: 0,
  };
  mockMarkets.push(newMarket);
  return newMarket;
}

// Betting
export async function placeBet(data: {
  marketId: string;
  option: string;
  amount: number;
}): Promise<Bet> {
  await delay(800);
  
  if (!walletState.connected) {
    throw new Error("Wallet not connected");
  }
  if (data.amount > walletState.balance) {
    throw new Error("Insufficient balance");
  }

  const market = mockMarkets.find((m) => m.id === data.marketId);
  if (!market) throw new Error("Market not found");

  const option = market.options.find((o) => o.name === data.option);
  if (!option) throw new Error("Invalid option");

  walletState.balance -= data.amount;

  const bet: Bet = {
    id: `bet_${betIdCounter++}`,
    marketId: data.marketId,
    userId: walletState.address,
    option: data.option,
    amount: data.amount,
    odds: option.odds,
    timestamp: new Date().toISOString(),
    status: "pending",
    txHash: `0x${Math.random().toString(16).slice(2, 66)}`,
  };
  userBets.push(bet);

  // Simulate odds shift
  const optionIndex = market.options.findIndex((o) => o.name === data.option);
  if (optionIndex >= 0) {
    market.options[optionIndex].odds = Math.min(95, market.options[optionIndex].odds + Math.round(data.amount / 50));
    // Rebalance other options
    const total = market.options.reduce((s, o) => s + o.odds, 0);
    market.options.forEach((o, i) => {
      if (i !== optionIndex) {
        o.odds = Math.max(5, Math.round((o.odds / total) * 100));
      }
    });
  }

  return bet;
}

export async function fetchUserBets(): Promise<Bet[]> {
  await delay(200);
  return userBets;
}

// Wallet
export async function connectWallet(): Promise<{ address: string; balance: number }> {
  await delay(1000);
  
  // Simulate MetaMask-style wallet connection
  const address = `0x${Math.random().toString(16).slice(2, 10)}...${Math.random().toString(16).slice(2, 6)}`;
  walletState = {
    connected: true,
    address,
    balance: 1000, // Start with $1000 mock USDC
  };
  return { address, balance: walletState.balance };
}

export async function disconnectWallet(): Promise<void> {
  await delay(200);
  walletState = { connected: false, address: "", balance: 0 };
  userBets = [];
}

export function getWalletState() {
  return { ...walletState };
}

// Creator Dashboard
export async function fetchCreatorStats(): Promise<CreatorStats> {
  await delay(300);
  return {
    totalEarnings: "$1,247.50",
    totalVolume: "$83,200",
    embedViews: "45.2K",
    activeMarkets: mockMarkets.filter((m) => m.status === "active").length,
  };
}

export async function fetchCreatorMarkets(): Promise<Market[]> {
  await delay(300);
  return mockMarkets.slice(0, 4);
}

// Search
export async function searchMarkets(query: string): Promise<Market[]> {
  await delay(300);
  const q = query.toLowerCase();
  return mockMarkets.filter(
    (m) => m.question.toLowerCase().includes(q) || m.category.includes(q)
  );
}
