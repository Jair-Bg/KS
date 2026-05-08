import { useState, useCallback, useEffect } from "react";
import { mockBackend } from "@/lib/mockBackend";
import { toast } from "@/hooks/use-toast";

// Demo wallet — always "connected" using the mock backend's local profile.
export function useWallet() {
  const [balance, setBalance] = useState<number>(mockBackend.getBalance());
  const address = "demo@kastia.app";
  const connected = true;
  const isConnecting = false;

  useEffect(() => {
    const handler = () => setBalance(mockBackend.getBalance());
    window.addEventListener("kastia-mock-updated", handler);
    return () => window.removeEventListener("kastia-mock-updated", handler);
  }, []);

  const connect = useCallback(async () => {
    // No-op in demo mode
  }, []);

  const disconnect = useCallback(async () => {
    toast({ title: "Demo mode", description: "Sign-out is disabled in the demo." });
  }, []);

  const refreshBalance = useCallback(async () => {
    const bal = mockBackend.getBalance();
    setBalance(bal);
    return bal;
  }, []);

  return { connected, address, balance, isConnecting, connect, disconnect, refreshBalance };
}
