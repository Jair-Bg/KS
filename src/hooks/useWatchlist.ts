import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { addToWatchlist, fetchWatchlistIds, removeFromWatchlist } from "@/lib/api";
import { useAuth } from "./useAuth";
import { toast } from "@/hooks/use-toast";

export function useWatchlist() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [ids, setIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) { setIds(new Set()); return; }
    let cancelled = false;
    setLoading(true);
    fetchWatchlistIds()
      .then((s) => { if (!cancelled) setIds(s); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [user]);

  const isWatching = useCallback((marketId: string) => ids.has(marketId), [ids]);

  const toggle = useCallback(async (marketId: string) => {
    if (!user) {
      toast({ title: "Sign in required", description: "Sign in to save markets to your watchlist." });
      navigate("/auth");
      return;
    }
    const watching = ids.has(marketId);
    // optimistic
    setIds((prev) => {
      const next = new Set(prev);
      watching ? next.delete(marketId) : next.add(marketId);
      return next;
    });
    try {
      if (watching) {
        await removeFromWatchlist(marketId);
        toast({ title: "Removed from watchlist" });
      } else {
        await addToWatchlist(marketId);
        toast({ title: "Saved to watchlist" });
      }
    } catch (e: any) {
      // revert on failure
      setIds((prev) => {
        const next = new Set(prev);
        watching ? next.add(marketId) : next.delete(marketId);
        return next;
      });
      toast({ title: "Watchlist error", description: e?.message ?? "Try again.", variant: "destructive" });
    }
  }, [ids, user, navigate]);

  return { isWatching, toggle, ids, loading };
}
