import { useEffect, useMemo, useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Loader2, Copy, Check } from "lucide-react";
import { placeBet, type MarketOption } from "@/lib/api";
import { useWallet } from "@/hooks/useWallet";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { base, baseSepolia } from "wagmi/chains";
import { USDC } from "@/lib/wagmi";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";


interface TradeTicketProps {
  marketId: string;
  question: string;
  options: MarketOption[];
  initialPick?: string;
  onPlaced?: () => void;
}

type Side = "buy" | "sell";

const CHAIN_OPTIONS = [
  { id: base.id, name: base.name },
  { id: baseSepolia.id, name: baseSepolia.name },
];

function truncateAddress(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function TradeTicket({ marketId, question, options, initialPick, onPlaced }: TradeTicketProps) {
  const { connected, balance, refreshBalance } = useWallet();
  const navigate = useNavigate();
  const [pick, setPick] = useState<string>(initialPick ?? options[0]?.name ?? "Yes");
  const [side, setSide] = useState<Side>("buy");
  const [amount, setAmount] = useState("2");
  const [submitting, setSubmitting] = useState(false);
  const [chainId, setChainId] = useState<number>(() => {
    const saved = localStorage.getItem("kastia:usdc-chain");
    return saved ? Number(saved) : baseSepolia.id;
  });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    localStorage.setItem("kastia:usdc-chain", String(chainId));
  }, [chainId]);

  const activeChain = CHAIN_OPTIONS.find((c) => c.id === chainId) ?? CHAIN_OPTIONS[0];
  const usdcAddress = USDC.addresses[chainId as keyof typeof USDC.addresses] ?? USDC.addresses[baseSepolia.id];

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(usdcAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  useEffect(() => {
    if (initialPick) setPick(initialPick);
  }, [initialPick]);

  const picked = options.find((o) => o.name === pick) ?? options[0];
  const numAmount = Math.max(parseFloat(amount) || 0, 0);

  // Buy at current odds. Sell = exit by buying the opposite outcome.
  // This keeps the demo backend simple while giving users a real "exit" action.
  const effectiveOption = useMemo(() => {
    if (side === "buy") return picked.name;
    const opposite = options.find((o) => o.name !== picked.name);
    return opposite?.name ?? picked.name;
  }, [side, picked, options]);

  const effectiveOdds = useMemo(() => {
    const opt = options.find((o) => o.name === effectiveOption);
    return opt?.odds ?? picked.odds;
  }, [effectiveOption, options, picked]);

  const priceCents = Math.round(effectiveOdds);
  const sharesPerDollar = 100 / Math.max(priceCents, 1);
  const shares = numAmount * sharesPerDollar;
  const payout = shares; // each share pays out $1 if it wins
  const profit = payout - numAmount;
  const insufficient = numAmount > balance;

  const handleSubmit = async () => {
    if (!connected) {
      navigate("/auth");
      return;
    }
    if (numAmount <= 0 || insufficient) return;
    setSubmitting(true);
    try {
      const res = await placeBet({ marketId, option: effectiveOption, amount: numAmount });
      await refreshBalance();
      onPlaced?.();
      toast({
        title: side === "buy" ? "✅ Order filled" : "✅ Exit filled",
        description: `${side === "buy" ? "Bought" : "Sold via"} ${effectiveOption} · ${shares.toFixed(1)} shares @ ${priceCents}¢ · payout $${Number(res.payout).toFixed(2)}`,
      });
      setAmount("2");
    } catch (e: any) {
      toast({
        title: "❌ Order failed",
        description: e?.message ?? "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground">Trade</h3>
        <div className="flex bg-secondary/60 rounded-lg p-0.5 text-xs">
          <button
            onClick={() => setSide("buy")}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              side === "buy" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground"
            }`}
          >
            Buy
          </button>
          <button
            onClick={() => setSide("sell")}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              side === "sell" ? "bg-destructive text-destructive-foreground shadow-sm" : "text-muted-foreground"
            }`}
          >
            Sell
          </button>
        </div>
      </div>

      {/* Network selector */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Network</span>
          <Select value={String(chainId)} onValueChange={(v) => setChainId(Number(v))}>
            <SelectTrigger className="h-7 text-xs w-[140px] bg-secondary border-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CHAIN_OPTIONS.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <button
          onClick={handleCopyAddress}
          className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
          title="Copy USDC address"
          type="button"
        >
          <span className="font-mono">{truncateAddress(usdcAddress)}</span>
          {copied ? <Check className="w-3 h-3 text-primary" /> : <Copy className="w-3 h-3" />}
        </button>
      </div>

      {/* Outcome selector */}
      <div className={`grid gap-2 ${options.length > 2 ? "grid-cols-2" : "grid-cols-2"}`}>
        {options.map((o) => {
          const active = o.name === pick;
          const isYes = o.name.toLowerCase() === "yes";
          return (
            <button
              key={o.name}
              onClick={() => setPick(o.name)}
              className={`flex flex-col items-start p-3 rounded-xl border transition-all ${
                active
                  ? isYes
                    ? "border-primary bg-primary/10"
                    : "border-destructive bg-destructive/10"
                  : "border-border bg-secondary/40 hover:bg-secondary/70"
              }`}
            >
              <span className="text-xs text-muted-foreground">{o.name}</span>
              <span
                className={`text-xl font-bold ${
                  active ? (isYes ? "text-primary" : "text-destructive") : "text-foreground"
                }`}
              >
                {o.odds}¢
              </span>
            </button>
          );
        })}
      </div>

      {/* Amount */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-foreground">Amount</label>
          <span className="text-xs text-muted-foreground">Balance ${balance.toFixed(2)}</span>
        </div>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium text-sm">USDC</span>
          <Input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="pl-16 h-12 text-lg bg-secondary border-0 rounded-xl font-mono"
            min={0}
            step="0.01"
          />
        </div>
        <div className="flex gap-2 mt-2">
          {[1, 2, 5, 10].map((v) => (
            <button
              key={v}
              onClick={() => setAmount(String(Math.min(v, balance || v)))}
              className="flex-1 py-1.5 text-xs font-medium rounded-lg bg-secondary hover:bg-muted-foreground/10 text-foreground transition-colors"
            >
              ${v}
            </button>
          ))}
          <button
            onClick={() => setAmount(String(balance))}
            className="flex-1 py-1.5 text-xs font-medium rounded-lg bg-secondary hover:bg-muted-foreground/10 text-foreground transition-colors"
          >
            Max
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-secondary/40 rounded-xl p-3 space-y-1.5 text-sm font-mono">
        <Row label="Side" value={`${side.toUpperCase()} ${picked.name}`} />
        <Row label="Price" value={`${priceCents}¢`} />
        <Row label="Shares" value={shares.toFixed(2)} />
        <Row label="Potential payout" value={`$${payout.toFixed(2)}`} highlight />
        <Row
          label="Profit if won"
          value={`${profit >= 0 ? "+" : ""}$${profit.toFixed(2)}`}
          tone={profit >= 0 ? "positive" : "negative"}
        />
      </div>

      <Button
        variant={side === "buy" ? "signup" : "destructive"}
        className="w-full h-12 rounded-xl text-base"
        onClick={handleSubmit}
        disabled={submitting || numAmount <= 0 || insufficient}
      >
        {submitting ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Placing order...
          </>
        ) : !connected ? (
          "Sign in to trade"
        ) : insufficient ? (
          "Insufficient balance"
        ) : (
          `${side === "buy" ? "Buy" : "Sell"} ${picked.name} · $${numAmount.toFixed(2)}`
        )}
      </Button>

      <p className="text-[11px] text-center text-muted-foreground">
        {question.length > 80 ? question.slice(0, 80) + "…" : question}
      </p>
    </div>
  );
}

function Row({
  label,
  value,
  highlight,
  tone,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  tone?: "positive" | "negative";
}) {
  const color = tone === "positive" ? "text-primary" : tone === "negative" ? "text-destructive" : "text-foreground";
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={`${highlight ? "font-bold" : ""} ${color}`}>{value}</span>
    </div>
  );
}
