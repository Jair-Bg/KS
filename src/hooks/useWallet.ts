import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { getProfileBalance } from "@/lib/api";

// Real wallet — backed by the profiles table.
export function useWallet() {
  const { user } = useAuth();
  const connected = !!user;
  const address = user?.email ?? "";
  const [balance, setBalance] = useState<number>(0);
  const [isConnecting] = useState(false);

  const refreshBalance = useCallback(async () => {
    if (!user) {
      setBalance(0);
      return 0;
    }
    const bal = await getProfileBalance();
    setBalance(bal);
    return bal;
  }, [user]);

  useEffect(() => {
    refreshBalance();
  }, [refreshBalance]);

  // Realtime updates when our profile changes (e.g. after place_bet)
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`profile-${user.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "profiles", filter: `user_id=eq.${user.id}` },
        (payload: any) => {
          if (payload?.new?.balance != null) setBalance(Number(payload.new.balance));
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const connect = useCallback(async () => {
    window.location.href = "/auth";
  }, []);

  const disconnect = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  return { connected, address, balance, isConnecting, connect, disconnect, refreshBalance };
}
