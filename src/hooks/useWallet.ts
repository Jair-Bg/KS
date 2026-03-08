import { useState, useCallback } from "react";
import { connectWallet, disconnectWallet, getWalletState } from "@/lib/api";
import { toast } from "@/hooks/use-toast";

export function useWallet() {
  const [address, setAddress] = useState(getWalletState().address);
  const [balance, setBalance] = useState(getWalletState().balance);
  const [isConnecting, setIsConnecting] = useState(false);
  const connected = !!address;

  const connect = useCallback(async () => {
    setIsConnecting(true);
    try {
      const result = await connectWallet();
      setAddress(result.address);
      setBalance(result.balance);
      toast({
        title: "Wallet connected",
        description: `Connected as ${result.address}`,
      });
    } catch {
      toast({
        title: "Connection failed",
        description: "Could not connect wallet. Try again.",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    await disconnectWallet();
    setAddress("");
    setBalance(0);
    toast({ title: "Wallet disconnected" });
  }, []);

  const refreshBalance = useCallback(() => {
    const state = getWalletState();
    setBalance(state.balance);
  }, []);

  return { connected, address, balance, isConnecting, connect, disconnect, refreshBalance };
}
