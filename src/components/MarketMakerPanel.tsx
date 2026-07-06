import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Loader2, Copy, Check, Zap } from "lucide-react";
import {
  mmGenerateQuotes,
  fetchMMInventory,
  type MMQuoteResponse,
} from "@/lib/api";
import { toast } from "@/hooks/use-toast";

interface Props {
  marketId: string;
  onQuoted?: () => void;
}

export function MarketMakerPanel({ marketId, onQuoted }: Props) {
  const [pModel, setPModel] = useState("0.55");
  const [confidence, setConfidence] = useState<"high" | "low">("high");
  const [quantity, setQuantity] = useState("1000");
  const [loading, setLoading] = useState(false);
  const [payload, setPayload] = useState<MMQuoteResponse | null>(null);
  const [inv, setInv] = useState<{ yes_qty: number; no_qty: number; target_notional: number } | null>(null);
  const [copied, setCopied] = useState(false);

  const loadInv = async () => setInv(await fetchMMInventory(marketId));
  useEffect(() => {
    loadInv();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [marketId]);

  const generate = async () => {
    const p = parseFloat(pModel);
    if (!(p > 0 && p < 1)) {
      toast({ title: "P_model must be between 0 and 1", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await mmGenerateQuotes({
        marketId,
        pModel: p,
        confidence,
        quantity: parseFloat(quantity) || 1000,
      });
      setPayload(res);
      onQuoted?.();
      loadInv();
      toast({
        title: "Quotes injected",
        description: `Mid $${res.mid.toFixed(2)} · spread ${(res.spread * 100).toFixed(0)}¢ · skew ${(res.skew * 100).toFixed(1)}¢`,
      });
    } catch (e: any) {
      toast({ title: "MM failed", description: e?.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const copyJson = async () => {
    if (!payload) return;
    await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const netDelta = (inv?.yes_qty ?? 0) - (inv?.no_qty ?? 0);

  return (
    <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-foreground">Market Maker Bot</h3>
        </div>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground border border-border px-1.5 py-0.5 rounded">
          Creator only
        </span>
      </div>

      {/* Inventory */}
      <div className="grid grid-cols-3 gap-2 text-xs font-mono">
        <Stat label="YES held" value={(inv?.yes_qty ?? 0).toFixed(0)} />
        <Stat label="NO held" value={(inv?.no_qty ?? 0).toFixed(0)} />
        <Stat
          label="Net Δ"
          value={`${netDelta >= 0 ? "+" : ""}${netDelta.toFixed(0)}`}
          tone={netDelta > 0 ? "positive" : netDelta < 0 ? "negative" : "neutral"}
        />
      </div>

      {/* Inputs */}
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="text-xs text-muted-foreground">P_model</label>
          <Input
            type="number"
            step="0.01"
            min="0.01"
            max="0.99"
            value={pModel}
            onChange={(e) => setPModel(e.target.value)}
            className="h-10 bg-secondary border-0 rounded-lg font-mono"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Confidence</label>
          <div className="flex bg-secondary/60 rounded-lg p-0.5 text-xs h-10 items-center">
            {(["high", "low"] as const).map((c) => (
              <button
                key={c}
                onClick={() => setConfidence(c)}
                className={`flex-1 py-1.5 rounded-md font-medium transition-colors ${
                  confidence === c ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                }`}
              >
                {c === "high" ? "Tight" : "Wide"}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Qty/side</label>
          <Input
            type="number"
            step="1"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="h-10 bg-secondary border-0 rounded-lg font-mono"
          />
        </div>
      </div>

      <Button
        variant="signup"
        className="w-full h-11 rounded-xl"
        onClick={generate}
        disabled={loading}
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Injecting quotes…
          </>
        ) : (
          "Generate & inject 4 limit orders"
        )}
      </Button>

      {/* CLOB payload */}
      {payload && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs text-muted-foreground">CLOB API payload</div>
            <button
              onClick={copyJson}
              className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              {copied ? <Check className="w-3 h-3 text-primary" /> : <Copy className="w-3 h-3" />}
              {copied ? "Copied" : "Copy JSON"}
            </button>
          </div>
          <pre className="text-[10px] leading-relaxed bg-secondary/40 border border-border rounded-xl p-3 overflow-auto max-h-72 font-mono text-foreground">
{JSON.stringify(payload, null, 2)}
          </pre>
        </div>
      )}

      <p className="text-[10px] text-muted-foreground text-center">
        Delta-neutral quotes. Tight ±$0.01 (high conf) or wide ±$0.03 (low). Inventory skew ≤ ±2¢.
      </p>
    </div>
  );
}

function Stat({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "positive" | "negative" | "neutral";
}) {
  const color =
    tone === "positive" ? "text-primary" : tone === "negative" ? "text-destructive" : "text-foreground";
  return (
    <div className="bg-secondary/40 rounded-lg p-2">
      <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</div>
      <div className={`text-sm font-bold ${color}`}>{value}</div>
    </div>
  );
}
