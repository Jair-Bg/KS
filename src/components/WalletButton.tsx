import { useState } from "react";
import { Button } from "./ui/button";
import { Wallet, ChevronDown, LogOut, History, Copy, Check } from "lucide-react";
import { useWallet } from "@/hooks/useWallet";

export function WalletButton() {
  const { connected, address, balance, isConnecting, connect, disconnect } = useWallet();
  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (!connected) {
    return (
      <Button
        variant="signup"
        size="pill"
        onClick={connect}
        disabled={isConnecting}
        className="gap-1.5"
      >
        <Wallet className="w-3.5 h-3.5" />
        {isConnecting ? "Connecting..." : "Connect Wallet"}
      </Button>
    );
  }

  return (
    <div className="relative">
      <Button
        variant="odds"
        size="pill"
        onClick={() => setMenuOpen(!menuOpen)}
        className="gap-1.5"
      >
        <span className="w-2 h-2 rounded-full bg-success" />
        <span className="font-mono text-xs">{address}</span>
        <ChevronDown className="w-3 h-3" />
      </Button>

      {menuOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-56 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden animate-fade-in">
            <div className="px-4 py-3 border-b border-border">
              <p className="text-xs text-muted-foreground">Balance</p>
              <p className="text-lg font-bold text-foreground">${balance.toFixed(2)} <span className="text-xs text-muted-foreground font-normal">USDC</span></p>
            </div>
            <div className="py-1">
              <button
                onClick={handleCopy}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-secondary transition-colors"
              >
                {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
                {copied ? "Copied!" : "Copy Address"}
              </button>
              <a
                href="/dashboard"
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-secondary transition-colors"
              >
                <History className="w-4 h-4" />
                My Predictions
              </a>
              <button
                onClick={() => { disconnect(); setMenuOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-destructive hover:bg-secondary transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Disconnect
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
