import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { TrendingUp, ArrowRight, Users, BarChart3, Clock, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

interface DemoMarket {
  id: string;
  question: string;
  category: string;
  yesOdds: number;
  noOdds: number;
  volume: string;
  traders: number;
  endDate: string;
  trending: boolean;
}

const demoMarkets: DemoMarket[] = [
  {
    id: "btc-120k",
    question: "Bitcoin above $120k by June 2025?",
    category: "Crypto",
    yesOdds: 34,
    noOdds: 66,
    volume: "$2.4M",
    traders: 1842,
    endDate: "Jun 30, 2025",
    trending: true,
  },
  {
    id: "ai-agi",
    question: "OpenAI announces AGI breakthrough in 2025?",
    category: "Tech",
    yesOdds: 12,
    noOdds: 88,
    volume: "$890K",
    traders: 3201,
    endDate: "Dec 31, 2025",
    trending: true,
  },
  {
    id: "kenya-2027",
    question: "Kenya opposition wins 2027 presidential election?",
    category: "Politics",
    yesOdds: 42,
    noOdds: 58,
    volume: "$180K",
    traders: 624,
    endDate: "Aug 15, 2027",
    trending: false,
  },
  {
    id: "eth-flippening",
    question: "Ethereum flips Bitcoin market cap by 2026?",
    category: "Crypto",
    yesOdds: 8,
    noOdds: 92,
    volume: "$1.1M",
    traders: 2105,
    endDate: "Dec 31, 2026",
    trending: false,
  },
];

function useOddsSimulation(baseYes: number) {
  const [odds, setOdds] = useState({ yes: baseYes, no: 100 - baseYes });

  useEffect(() => {
    const interval = setInterval(() => {
      setOdds((prev) => {
        const delta = (Math.random() - 0.5) * 2;
        const newYes = Math.max(2, Math.min(98, prev.yes + delta));
        return { yes: Math.round(newYes * 10) / 10, no: Math.round((100 - newYes) * 10) / 10 };
      });
    }, 3000 + Math.random() * 2000);
    return () => clearInterval(interval);
  }, []);

  return odds;
}

function DemoMarketCard({ market, isSelected, onSelect }: { market: DemoMarket; isSelected: boolean; onSelect: () => void }) {
  const odds = useOddsSimulation(market.yesOdds);
  const [pick, setPick] = useState<"yes" | "no" | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const handlePick = (side: "yes" | "no") => {
    setPick(side);
    setShowConfirm(true);
    setConfirmed(false);
  };

  const handleConfirm = () => {
    setConfirmed(true);
    setTimeout(() => {
      setShowConfirm(false);
      setConfirmed(false);
    }, 2500);
  };

  return (
    <motion.div
      layout
      onClick={onSelect}
      className={`premium-card p-5 md:p-6 cursor-pointer transition-all duration-300 ${isSelected ? "ring-1 ring-primary/30" : ""}`}
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold tracking-widest uppercase text-primary bg-primary/10 px-2 py-0.5 rounded-full">
            {market.category}
          </span>
          {market.trending && (
            <span className="text-xs font-bold tracking-widest uppercase text-warning bg-warning/10 px-2 py-0.5 rounded-full flex items-center gap-1">
              <TrendingUp className="w-2.5 h-2.5" /> Hot
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Clock className="w-3 h-3" />
          {market.endDate}
        </div>
      </div>

      <h3 className="font-semibold text-foreground text-base md:text-lg leading-snug mb-5">
        {market.question}
      </h3>

      {/* Odds bar visualization */}
      <div className="mb-4">
        <div className="flex justify-between text-sm font-medium mb-1.5">
          <span className="text-success">Yes {odds.yes.toFixed(1)}%</span>
          <span className="text-destructive">No {odds.no.toFixed(1)}%</span>
        </div>
        <div className="h-2 rounded-full bg-secondary overflow-hidden flex">
          <motion.div
            className="h-full bg-gradient-to-r from-success to-success/70 rounded-l-full"
            animate={{ width: `${odds.yes}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
          <motion.div
            className="h-full bg-gradient-to-r from-destructive/70 to-destructive rounded-r-full"
            animate={{ width: `${odds.no}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 mb-4">
        <Button
          variant={pick === "yes" ? "oddsActive" : "odds"}
          size="pill"
          className={`flex-1 min-h-11 h-11 text-base font-semibold transition-all duration-200 ${pick === "yes" ? "ring-2 ring-primary/30 shadow-md shadow-primary/10" : ""}`}
          onClick={(e) => { e.stopPropagation(); handlePick("yes"); }}
        >
          Yes {odds.yes.toFixed(0)}¢
        </Button>
        <Button
          variant={pick === "no" ? "oddsActive" : "odds"}
          size="pill"
          className={`flex-1 min-h-11 h-11 text-base font-semibold transition-all duration-200 ${pick === "no" ? "ring-2 ring-primary/30 shadow-md shadow-primary/10" : ""}`}
          onClick={(e) => { e.stopPropagation(); handlePick("no"); }}
        >
          No {odds.no.toFixed(0)}¢
        </Button>
      </div>

      {/* Confirm / success toast inline */}
      <AnimatePresence mode="wait">
        {showConfirm && !confirmed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Your pick</span>
                <span className="font-semibold text-foreground">{pick === "yes" ? "Yes" : "No"} @ {pick === "yes" ? odds.yes.toFixed(1) : odds.no.toFixed(1)}¢</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Demo payout</span>
                <span className="font-semibold text-success">
                  {(100 / (pick === "yes" ? odds.yes : odds.no)).toFixed(2)}x
                </span>
              </div>
              <Button
                variant="signup"
                className="w-full rounded-xl min-h-11 h-11 text-base font-semibold"
                onClick={(e) => { e.stopPropagation(); handleConfirm(); }}
              >
                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                Place Demo Trade
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                This is a demo — sign up to trade with real money
              </p>
            </div>
          </motion.div>
        )}
        {confirmed && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-success/10 border border-success/20 rounded-xl p-4 text-center"
          >
            <p className="text-sm font-semibold text-success">🎉 Demo trade placed!</p>
            <p className="text-sm text-muted-foreground mt-1">
              Sign up to trade for real and earn payouts
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Meta stats */}
      <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border text-sm text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <BarChart3 className="w-3 h-3" /> {market.volume} vol
        </span>
        <span className="flex items-center gap-1.5">
          <Users className="w-3 h-3" /> {market.traders.toLocaleString()} traders
        </span>
      </div>
    </motion.div>
  );
}

export function LiveDemo() {
  const [selectedId, setSelectedId] = useState(demoMarkets[0].id);
  const [filter, setFilter] = useState<string>("all");

  const categories = ["all", ...Array.from(new Set(demoMarkets.map((m) => m.category)))];

  const filtered = filter === "all" ? demoMarkets : demoMarkets.filter((m) => m.category === filter);

  return (
    <section id="live-demo" className="py-28 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-secondary/20 to-transparent pointer-events-none" />

      <div className="container relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 space-y-5"
        >
          <span className="section-label">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-60" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>
            Live Demo
          </span>
          <h2 className="section-heading">
            Try it <span className="gradient-text">right now</span>
          </h2>
          <p className="section-subheading mx-auto">
            No account needed. Click a side, see the odds move. This is what your audience experiences.
          </p>
        </motion.div>

        {/* Category filter pills */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="flex items-center justify-center gap-2 mb-10"
        >
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-4 min-h-11 inline-flex items-center rounded-full text-base md:text-sm font-medium transition-all duration-200 ${
                filter === cat
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              {cat === "all" ? "All" : cat}
            </button>
          ))}
        </motion.div>

        {/* Market grid */}
        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          <AnimatePresence mode="popLayout">
            {filtered.map((market, i) => (
              <motion.div
                key={market.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
              >
                <DemoMarketCard
                  market={market}
                  isSelected={selectedId === market.id}
                  onSelect={() => setSelectedId(market.id)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* CTA below demo */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-center mt-14 space-y-4"
        >
          <p className="text-muted-foreground text-base">
            Like what you see? Create your own markets and start earning.
          </p>
          <Link to="/auth">
            <Button
              variant="signup"
              size="lg"
              className="px-10 h-13 rounded-full text-base font-semibold shadow-xl shadow-primary/20 hover:shadow-2xl hover:shadow-primary/30 hover:scale-[1.02] transition-all duration-300"
            >
              Create Your First Market
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
