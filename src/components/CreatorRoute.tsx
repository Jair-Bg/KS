import { useEffect, useState } from "react";
import { Navigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { claimCreatorRole } from "@/lib/api";

export function CreatorRoute({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const { isCreator, loading: roleLoading, refresh } = useUserRole();
  const location = useLocation();
  const [activating, setActivating] = useState(false);
  const [attempted, setAttempted] = useState(false);

  // If the user just went through the creator signup flow (e.g. returning
  // from an OAuth redirect), finish activating the creator account here.
  useEffect(() => {
    if (authLoading || roleLoading || !user || isCreator || attempted) return;
    if (sessionStorage.getItem("pending_account_type") !== "creator") return;
    setAttempted(true);
    setActivating(true);
    claimCreatorRole()
      .catch((e) => console.error("Failed to activate creator account:", e))
      .finally(() => {
        sessionStorage.removeItem("pending_account_type");
        setActivating(false);
        refresh();
      });
  }, [authLoading, roleLoading, user, isCreator, attempted, refresh]);

  if (authLoading || roleLoading || activating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }
  if (!user) {
    // Creator surfaces are sign-in only, and they sign in through the
    // dedicated creator entry point — never the trader auth page.
    return <Navigate to="/auth/creator" state={{ from: location }} replace />;
  }

  if (!isCreator) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="max-w-md w-full bg-card border border-border rounded-2xl p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 text-primary mx-auto flex items-center justify-center">
            <Lock className="w-5 h-5" />
          </div>
          <h1 className="text-xl font-semibold">Creator account required</h1>
          <p className="text-sm text-muted-foreground">
            This area is only available to creator accounts. Create a new creator account to launch and monetize markets.
          </p>
          <div className="flex gap-2 justify-center pt-2">
            <Link to="/markets"><Button variant="outline">Browse markets</Button></Link>
            <Link to="/auth/creator"><Button>Become a creator</Button></Link>
          </div>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}

