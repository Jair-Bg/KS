import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, ShieldCheck } from "lucide-react";

type OAuthNamespace = {
  getAuthorizationDetails: (id: string) => Promise<{ data: any; error: any }>;
  approveAuthorization: (id: string) => Promise<{ data: any; error: any }>;
  denyAuthorization: (id: string) => Promise<{ data: any; error: any }>;
};

function oauth(): OAuthNamespace {
  return (supabase.auth as unknown as { oauth: OAuthNamespace }).oauth;
}

export default function OAuthConsent() {
  const [params] = useSearchParams();
  const authorizationId = params.get("authorization_id") ?? "";
  const [details, setDetails] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!authorizationId) {
        setError("Missing authorization_id");
        return;
      }
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        const next = window.location.pathname + window.location.search;
        window.location.href = "/auth?next=" + encodeURIComponent(next);
        return;
      }
      const { data, error } = await oauth().getAuthorizationDetails(authorizationId);
      if (!active) return;
      if (error) {
        setError(error.message);
        return;
      }
      const immediate = data?.redirect_url ?? data?.redirect_to;
      if (immediate && !data?.client) {
        window.location.href = immediate;
        return;
      }
      setDetails(data);
    })();
    return () => {
      active = false;
    };
  }, [authorizationId]);

  async function decide(approve: boolean) {
    setBusy(true);
    const { data, error } = approve
      ? await oauth().approveAuthorization(authorizationId)
      : await oauth().denyAuthorization(authorizationId);
    if (error) {
      setBusy(false);
      setError(error.message);
      return;
    }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) {
      setBusy(false);
      setError("No redirect returned by the authorization server.");
      return;
    }
    window.location.href = target;
  }

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl p-6 shadow-sm">
        <div className="text-center mb-6">
          <span className="text-2xl font-bold text-primary">Kastia</span>
        </div>

        {error ? (
          <div className="text-sm text-destructive text-center">
            Could not complete this authorization request: {error}
          </div>
        ) : !details ? (
          <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm py-6">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </div>
        ) : (
          <>
            <div className="flex items-start gap-3 mb-5">
              <ShieldCheck className="w-5 h-5 text-primary mt-0.5 shrink-0" />
              <div>
                <h1 className="text-lg font-semibold text-foreground">
                  Connect {details.client?.name ?? "an app"} to your account
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  {details.client?.name ?? "This client"} will be able to browse markets, view your
                  balance and positions, and place trades as you.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 h-11" disabled={busy} onClick={() => decide(false)}>
                Deny
              </Button>
              <Button className="flex-1 h-11" disabled={busy} onClick={() => decide(true)}>
                {busy && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Approve
              </Button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
