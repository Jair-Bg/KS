import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { X, Loader2, CheckCircle2 } from "lucide-react";
import { placeBet } from "@/lib/api";
import { useWallet } from "@/hooks/useWallet";

interface BetModalProps {
  open: boolean;
  onClose: () => void;
  marketId: string;
  question: string;
  option: string;
  odds: number;
  payout: string;
}

export function BetModal({ open, onClose, marketId, question, option, odds, payout }: BetModalProps) {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ bet_id: string; odds: number; payout: number } | null>(null);
  const [error, setError] = useState("");
  const { connected, balance, connect, isConnecting, refreshBalance } = useWallet();

  if (!open) return null;

  const numAmount = parseFloat(amount) || 0;
  const potentialPayout = numAmount * parseFloat(payout);

  const handleBet = async () => {
    setError("");
    setLoading(true);
    try {
      const betResult = await placeBet({ marketId, option, amount: numAmount });
      setResult(betResult);
      refreshBalance();
    } catch (e: any) {
      setError(e.message || "Bet failed");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setAmount("");
    setResult(null);
    setError("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md mx-4 animate-fade-in overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="font-semibold text-foreground">Place Prediction</h3>
          <button onClick={handleClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Success state */}
          {result ? (
            <div className="text-center space-y-4 py-4">
              <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8 text-success" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-foreground">Bet Placed! 🎉</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  ${numAmount.toFixed(2)} on <span className="font-semibold text-foreground">{option}</span> at {result.odds}%
                </p>
                <p className="text-sm text-success font-semibold mt-1">
                  Potential payout: ${result.payout}
                </p>
              </div>
              <Button variant="signup" className="w-full rounded-xl" onClick={handleClose}>
                Done
              </Button>
            </div>
          ) : !connected ? (
            /* Connect / sign in state */
            <div className="text-center space-y-4 py-4">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                <span className="text-2xl">🔑</span>
              </div>
              <div>
                <h4 className="font-semibold text-foreground">Sign In to Trade</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Sign in to place predictions and earn payouts.
                </p>
              </div>
              <Button
                variant="signup"
                className="w-full rounded-xl h-12"
                onClick={connect}
                disabled={isConnecting}
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Connecting...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </div>
          ) : (
            /* Bet form */
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
                  <label className="text-sm font-medium text-foreground">Amount (USDC)</label>
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
                    <span className="font-bold text-success">${potentialPayout.toFixed(2)}</span>
                  </div>
                </div>
              )}

              {error && (
                <p className="text-sm text-destructive text-center">{error}</p>
              )}

              <Button
                variant="signup"
                className="w-full rounded-xl h-12 text-base"
                onClick={handleBet}
                disabled={loading || numAmount <= 0 || numAmount > balance}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Placing bet...
                  </>
                ) : (
                  `Place $${numAmount.toFixed(2)} on ${option}`
                )}
              </Button>

              <p className="text-[11px] text-center text-muted-foreground">
                Settlement on Base (L2) · USDC payouts
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
