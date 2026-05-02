import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { X, Loader2, CheckCircle2 } from "lucide-react";
import { placeBet } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { useWallet } from "@/hooks/useWallet";
import { useNavigate } from "react-router-dom";

interface DemoBetDialogProps {
  open: boolean;
  onClose: () => void;
  marketId: string;
  question: string;
  option: string;
  odds: number;
  payout: string;
  onPlaced?: () => void;
}

export function DemoBetDialog({
  open,
  onClose,
  marketId,
  question,
  option,
  odds,
  payout,
  onPlaced,
}: DemoBetDialogProps) {
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const { connected, balance, refreshBalance } = useWallet();
  const navigate = useNavigate();

  if (!open) return null;

  const numAmount = parseFloat(amount) || 0;
  const potentialPayout = numAmount * parseFloat(payout);
  const insufficient = numAmount > balance;

  const handleClose = () => {
    setAmount("");
    setDone(false);
    onClose();
  };

  const handleSubmit = async () => {
    if (!connected) {
      navigate("/auth");
      return;
    }
    if (numAmount <= 0 || insufficient) return;
    setSubmitting(true);
    try {
      await placeBet({ marketId, option, amount: numAmount });
      await refreshBalance();
      setDone(true);
      onPlaced?.();
      toast({
        title: "Bet placed",
        description: `$${numAmount.toFixed(2)} on ${option} at ${odds}%`,
      });
    } catch (e: any) {
      toast({
        title: "Bet failed",
        description: e?.message ?? "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md mx-4 animate-fade-in overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="font-semibold text-foreground">Place Bet (Demo)</h3>
          <button onClick={handleClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {done ? (
            <div className="text-center space-y-4 py-4">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-foreground">Bet placed! 🎉</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  ${numAmount.toFixed(2)} on <span className="font-semibold text-foreground">{option}</span> at {odds}%
                </p>
                <p className="text-sm text-primary font-semibold mt-1">
                  Potential payout: ${potentialPayout.toFixed(2)}
                </p>
              </div>
              <Button variant="signup" className="w-full rounded-xl" onClick={handleClose}>
                Done
              </Button>
            </div>
          ) : !connected ? (
            <div className="text-center space-y-4 py-4">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                <span className="text-2xl">👤</span>
              </div>
              <div>
                <h4 className="font-semibold text-foreground">Sign in to trade</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Demo balance is tied to your account. Sign in to place a bet.
                </p>
              </div>
              <Button variant="signup" className="w-full rounded-xl" onClick={() => navigate("/auth")}>
                Sign in
              </Button>
            </div>
          ) : (
            <>
              <div className="bg-secondary/50 rounded-xl p-4">
                <p className="text-sm text-muted-foreground mb-1">Market</p>
                <p className="text-sm font-medium text-foreground leading-tight">{question}</p>
              </div>

              <div className="flex items-center justify-between bg-primary/5 border border-primary/20 rounded-xl p-4">
                <div>
                  <p className="text-xs text-muted-foreground">Your pick</p>
                  <p className="text-lg font-bold text-foreground">{option}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Current odds</p>
                  <p className="text-lg font-bold text-primary">{odds}%</p>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-foreground">Amount</label>
                  <span className="text-xs text-muted-foreground">Balance: ${balance.toFixed(2)}</span>
                </div>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">$</span>
                  <Input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="pl-8 h-12 text-lg bg-secondary border-0 rounded-xl"
                    min="0"
                    max={balance}
                    step="0.01"
                  />
                </div>
                <div className="flex gap-2 mt-2">
                  {[10, 25, 50, 100].map((v) => (
                    <button
                      key={v}
                      onClick={() => setAmount(String(Math.min(v, balance)))}
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

              {numAmount > 0 && (
                <div className="bg-secondary/50 rounded-xl p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Payout multiplier</span>
                    <span className="font-medium text-foreground">{payout}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Potential payout</span>
                    <span className="font-bold text-primary">${potentialPayout.toFixed(2)}</span>
                  </div>
                </div>
              )}

              <Button
                variant="signup"
                className="w-full rounded-xl h-12 text-base"
                onClick={handleSubmit}
                disabled={submitting || numAmount <= 0 || insufficient}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Placing bet...
                  </>
                ) : insufficient ? (
                  "Insufficient balance"
                ) : (
                  `Place $${numAmount.toFixed(2)} on ${option}`
                )}
              </Button>

              <p className="text-[11px] text-center text-muted-foreground">
                Demo mode · No real money
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
