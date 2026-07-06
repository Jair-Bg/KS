import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Loader2, X } from "lucide-react";
import {
  placeLimitOrder,
  cancelOrder,
  fetchMyOrders,
  fetchMyPosition,
  type OrderRow,
  type PositionRow,
} from "@/lib/api";
import { supabase } from "@/integrations/supabase/client";
import { useWallet } from "@/hooks/useWallet";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface Props {
  marketId: string;
  question: string;
  yesOdds: number;
  onPlaced?: () => void;
}

type Side = "BUY" | "SELL";
type Contract = "YES" | "NO";

export function ClobTradeTicket({ marketId, question, yesOdds, onPlaced }: Props) {
  const { connected, balance, refreshBalance } = useWallet();
  const navigate = useNavigate();
  const [side, setSide] = useState<Side>("BUY");
  const [contract, setContract] = useState<Contract>("YES");
  const [price, setPrice] = useState<string>((Math.round(yesOdds) / 100).toFixed(2));
  const [qty, setQty] = useState<string>("100");
  const [submitting, setSubmitting] = useState(false);
  const [myOrders, setMyOrders] = useState<OrderRow[]>([]);
  const [pos, setPos] = useState<PositionRow | null>(null);

  const reload = async () => {
    const [o, p] = await Promise.all([fetchMyOrders(marketId), fetchMyPosition(marketId)]);
    setMyOrders(o.filter((x) => x.status === "open"));
    setPos(p);
  };

  useEffect(() => {
    reload();
    const ch = supabase
      .channel(`clob-mine-${marketId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "orders", filter: `market_id=eq.${marketId}` }, () => reload())
      .on("postgres_changes", { event: "*", schema: "public", table: "positions", filter: `market_id=eq.${marketId}` }, () => reload())
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [marketId]);

  const numPrice = Math.max(Math.min(parseFloat(price) || 0, 0.99), 0.01);
  const numQty = Math.max(parseFloat(qty) || 0, 0);
  const cost = side === "BUY" ? numPrice * numQty : 0;
  const insufficient = side === "BUY" && cost > balance;
  const noPos =
    side === "SELL" &&
    (!pos || (contract === "YES" ? pos.yes_qty : pos.no_qty) < numQty);

  const submit = async () => {
    if (!connected) {
      navigate("/auth");
      return;
    }
    if (numQty <= 0 || insufficient || noPos) return;
    setSubmitting(true);
    try {
      await placeLimitOrder({ marketId, side, contract, price: numPrice, quantity: numQty });
      await refreshBalance();
      onPlaced?.();
      toast({
        title: "Order placed",
        description: `${side} ${numQty} ${contract} @ $${numPrice.toFixed(2)}`,
      });
      reload();
    } catch (e: any) {
      toast({ title: "Order failed", description: e?.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const cancel = async (id: string) => {
    try {
      await cancelOrder(id);
      await refreshBalance();
      toast({ title: "Order cancelled" });
      reload();
    } catch (e: any) {
      toast({ title: "Cancel failed", description: e?.message, variant: "destructive" });
    }
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground">CLOB · Limit Order</h3>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground border border-border px-1.5 py-0.5 rounded">
          Order Book
        </span>
      </div>

      {/* Side + contract */}
      <div className="grid grid-cols-2 gap-2">
        <div className="flex bg-secondary/60 rounded-lg p-0.5 text-xs">
          {(["BUY", "SELL"] as Side[]).map((s) => (
            <button
              key={s}
              onClick={() => setSide(s)}
              className={`flex-1 py-1.5 rounded-md font-medium transition-colors ${
                side === s
                  ? s === "BUY"
                    ? "bg-primary text-primary-foreground"
                    : "bg-destructive text-destructive-foreground"
                  : "text-muted-foreground"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="flex bg-secondary/60 rounded-lg p-0.5 text-xs">
          {(["YES", "NO"] as Contract[]).map((c) => (
            <button
              key={c}
              onClick={() => setContract(c)}
              className={`flex-1 py-1.5 rounded-md font-medium transition-colors ${
                contract === c ? "bg-foreground text-background" : "text-muted-foreground"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Price + Qty */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-muted-foreground">Limit price ($)</label>
          <Input
            type="number"
            step="0.01"
            min="0.01"
            max="0.99"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="h-11 bg-secondary border-0 rounded-lg font-mono"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Quantity</label>
          <Input
            type="number"
            step="1"
            min="1"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            className="h-11 bg-secondary border-0 rounded-lg font-mono"
          />
        </div>
      </div>

      {/* Summary */}
      <div className="bg-secondary/40 rounded-xl p-3 space-y-1 text-xs font-mono">
        <Row label="Est. cost" value={`$${cost.toFixed(2)}`} />
        <Row label="Balance" value={`$${balance.toFixed(2)}`} />
        <Row
          label="Position"
          value={`YES ${pos?.yes_qty ?? 0} · NO ${pos?.no_qty ?? 0}`}
        />
      </div>

      <Button
        variant={side === "BUY" ? "signup" : "destructive"}
        className="w-full h-11 rounded-xl"
        disabled={submitting || numQty <= 0 || insufficient || noPos}
        onClick={submit}
      >
        {submitting ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Placing…
          </>
        ) : !connected ? (
          "Sign in to trade"
        ) : insufficient ? (
          "Insufficient balance"
        ) : noPos ? (
          `Need ${contract} to sell`
        ) : (
          `${side} ${numQty} ${contract} @ $${numPrice.toFixed(2)}`
        )}
      </Button>

      {/* Open orders */}
      {myOrders.length > 0 && (
        <div className="pt-2 border-t border-border">
          <div className="text-xs text-muted-foreground mb-2">Open orders</div>
          <div className="space-y-1 max-h-40 overflow-auto">
            {myOrders.map((o) => (
              <div
                key={o.id}
                className="flex items-center justify-between text-xs font-mono bg-secondary/30 rounded-lg px-2 py-1.5"
              >
                <span
                  className={o.side === "BUY" ? "text-primary" : "text-destructive"}
                >
                  {o.side} {o.contract}
                </span>
                <span>
                  {o.quantity - o.filled}@${Number(o.price).toFixed(2)}
                </span>
                <button
                  onClick={() => cancel(o.id)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="text-[10px] text-center text-muted-foreground">
        Peer-to-peer CLOB · YES + NO = $1.00 · complementary fills mint
      </p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-foreground">{value}</span>
    </div>
  );
}
