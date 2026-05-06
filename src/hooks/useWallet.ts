import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getProfileBalance } from "@/lib/api";
import { toast } from "@/hooks/use-toast";

export function useWallet() {
  const [address, setAddress] = useState("");
  const [balance, setBalance] = useState(0);
  const [isConnecting, setIsConnecting] = useState(false);
  const connected = !!address;

  // Sync with auth state
  useEffect(() => {
    const loadUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setAddress(session.user.email || session.user.id.slice(0, 8));
        const bal = await getProfileBalance();
        setBalance(bal);
      }
    };
    loadUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setAddress(session.user.email || session.user.id.slice(0, 8));
        const bal = await getProfileBalance();
        setBalance(bal);
      } else {
        setAddress("");
        setBalance(0);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const connect = useCallback(async () => {
    setIsConnecting(true);
    // Redirect to auth if not logged in
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      window.location.href = "/auth";
      return;
    }
    setIsConnecting(false);
  }, []);

  const disconnect = useCallback(async () => {
    await supabase.auth.signOut();
    setAddress("");
    setBalance(0);
    toast({ title: "Signed out" });
  }, []);

  const refreshBalance = useCallback(async () => {
    const bal = await getProfileBalance();
    setBalance(bal);
    return bal;
  }, []);

  return { connected, address, balance, isConnecting, connect, disconnect, refreshBalance };
}
