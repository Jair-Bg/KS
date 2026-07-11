import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loader2, ScrollText } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

type AuditRow = {
  id: string;
  created_at: string;
  action: string;
  actor_id: string;
  actor_name: string | null;
  target_user_id: string | null;
  target_user_name: string | null;
  target_market_id: string | null;
  target_market_question: string | null;
  details: Record<string, unknown>;
};

const actionLabel: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  grant_role: { label: "Grant role", variant: "default" },
  revoke_role: { label: "Revoke role", variant: "destructive" },
  force_resolve: { label: "Force resolve", variant: "secondary" },
};

export default function AdminAudit() {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data, error } = await supabase.rpc("admin_list_audit" as any, { p_limit: 500 });
      if (!error && data) setRows(data as any);
      setLoading(false);
    })();
  }, []);

  const filtered = rows.filter((r) => {
    if (!q) return true;
    const hay = `${r.action} ${r.actor_name ?? ""} ${r.target_user_name ?? ""} ${r.target_market_question ?? ""} ${JSON.stringify(r.details)}`.toLowerCase();
    return hay.includes(q.toLowerCase());
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container max-w-6xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <ScrollText className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold">Admin Audit Log</h1>
          </div>
          <Link to="/admin"><Button variant="outline" size="sm">Back to admin</Button></Link>
        </div>

        <Input placeholder="Search actions, users, markets…" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-md" />

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="animate-spin text-primary" /></div>
        ) : filtered.length === 0 ? (
          <Card className="p-8 text-center text-sm text-muted-foreground">No audit entries yet.</Card>
        ) : (
          <Card className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-muted-foreground border-b border-border">
                <tr>
                  <th className="text-left p-3">Time</th>
                  <th className="text-left p-3">Action</th>
                  <th className="text-left p-3">Actor</th>
                  <th className="text-left p-3">Target</th>
                  <th className="text-left p-3">Details</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => {
                  const meta = actionLabel[r.action] ?? { label: r.action, variant: "outline" as const };
                  return (
                    <tr key={r.id} className="border-b border-border/50 align-top">
                      <td className="p-3 whitespace-nowrap text-xs text-muted-foreground">
                        {new Date(r.created_at).toLocaleString()}
                      </td>
                      <td className="p-3"><Badge variant={meta.variant}>{meta.label}</Badge></td>
                      <td className="p-3">
                        <div className="font-medium">{r.actor_name ?? "—"}</div>
                        <div className="text-xs text-muted-foreground font-mono">{r.actor_id.slice(0, 8)}…</div>
                      </td>
                      <td className="p-3">
                        {r.target_user_id && (
                          <div>
                            <div className="font-medium">{r.target_user_name ?? "—"}</div>
                            <div className="text-xs text-muted-foreground font-mono">{r.target_user_id.slice(0, 8)}…</div>
                          </div>
                        )}
                        {r.target_market_id && (
                          <div className="max-w-xs truncate" title={r.target_market_question ?? ""}>
                            {r.target_market_question ?? r.target_market_id.slice(0, 8)}
                          </div>
                        )}
                      </td>
                      <td className="p-3">
                        <pre className="text-xs bg-muted/40 rounded p-2 max-w-sm overflow-x-auto">
{JSON.stringify(r.details, null, 2)}
                        </pre>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        )}
      </main>
    </div>
  );
}
