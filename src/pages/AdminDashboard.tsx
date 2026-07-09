import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, Shield, ShieldOff, CheckCircle2, XCircle } from "lucide-react";
import { fetchMarkets, formatVolume, type Market } from "@/lib/api";

type Stats = {
  total_users: number; total_markets: number; active_markets: number; resolved_markets: number;
  total_bets: number; total_volume: number; total_orders: number; open_orders: number;
  total_trades: number; total_balance: number;
};
type UserRow = {
  user_id: string; display_name: string | null; balance: number; total_bets: number;
  total_winnings: number; created_markets: number; roles: string[]; created_at: string;
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [markets, setMarkets] = useState<Market[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const [s, u, m] = await Promise.all([
      supabase.rpc("admin_get_stats" as any),
      supabase.rpc("admin_list_users" as any, { p_limit: 200 }),
      fetchMarkets(),
    ]);
    if (s.data) setStats(s.data as any);
    if (u.data) setUsers(u.data as any);
    setMarkets(m);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function toggleRole(uid: string, role: "admin" | "creator", grant: boolean) {
    const { error } = await supabase.rpc("admin_set_role" as any, {
      p_user_id: uid, p_role: role, p_grant: grant,
    });
    if (error) return toast.error(error.message);
    toast.success(`${grant ? "Granted" : "Revoked"} ${role}`);
    load();
  }

  async function resolve(marketId: string, outcome: "Yes" | "No") {
    const { error } = await supabase.rpc("admin_force_resolve" as any, {
      p_market_id: marketId, p_outcome: outcome,
    });
    if (error) return toast.error(error.message);
    toast.success(`Resolved ${outcome}`);
    load();
  }

  const filtered = users.filter(u =>
    !q || u.display_name?.toLowerCase().includes(q.toLowerCase()) || u.user_id.includes(q)
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container max-w-7xl mx-auto px-4 py-8 space-y-8">
        <div className="flex items-center gap-3">
          <Shield className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        </div>

        {loading && !stats ? (
          <div className="flex justify-center py-16"><Loader2 className="animate-spin text-primary" /></div>
        ) : (
          <>
            {/* Stats */}
            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {[
                  ["Users", stats.total_users],
                  ["Markets", `${stats.active_markets}/${stats.total_markets}`],
                  ["Bets", stats.total_bets],
                  ["Volume", formatVolume(Number(stats.total_volume))],
                  ["Balance held", formatVolume(Number(stats.total_balance))],
                  ["Orders open", `${stats.open_orders}/${stats.total_orders}`],
                  ["Trades", stats.total_trades],
                  ["Resolved", stats.resolved_markets],
                ].map(([label, val]) => (
                  <Card key={label as string} className="p-4">
                    <div className="text-xs text-muted-foreground">{label}</div>
                    <div className="text-xl font-bold mt-1">{val}</div>
                  </Card>
                ))}
              </div>
            )}

            {/* Users */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Users & roles</h2>
                <Input placeholder="Search…" value={q} onChange={e => setQ(e.target.value)} className="max-w-xs" />
              </div>
              <Card className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-xs text-muted-foreground border-b border-border">
                    <tr><th className="text-left p-3">User</th><th className="text-left p-3">Roles</th><th className="text-right p-3">Balance</th><th className="text-right p-3">Bets</th><th className="text-right p-3">Markets</th><th className="text-right p-3">Actions</th></tr>
                  </thead>
                  <tbody>
                    {filtered.map(u => {
                      const isAdmin = u.roles.includes("admin");
                      const isCreator = u.roles.includes("creator");
                      return (
                        <tr key={u.user_id} className="border-b border-border/50">
                          <td className="p-3">
                            <div className="font-medium">{u.display_name ?? "—"}</div>
                            <div className="text-xs text-muted-foreground font-mono">{u.user_id.slice(0, 8)}…</div>
                          </td>
                          <td className="p-3 space-x-1">
                            {u.roles.map(r => <Badge key={r} variant={r === "admin" ? "default" : "secondary"}>{r}</Badge>)}
                          </td>
                          <td className="p-3 text-right">${Number(u.balance).toFixed(2)}</td>
                          <td className="p-3 text-right">{u.total_bets}</td>
                          <td className="p-3 text-right">{u.created_markets}</td>
                          <td className="p-3 text-right space-x-1 whitespace-nowrap">
                            <Button size="sm" variant="outline" onClick={() => toggleRole(u.user_id, "creator", !isCreator)}>
                              {isCreator ? <ShieldOff className="w-3 h-3 mr-1" /> : <Shield className="w-3 h-3 mr-1" />}
                              {isCreator ? "Revoke creator" : "Make creator"}
                            </Button>
                            <Button size="sm" variant={isAdmin ? "destructive" : "default"} onClick={() => toggleRole(u.user_id, "admin", !isAdmin)}>
                              {isAdmin ? "Revoke admin" : "Make admin"}
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </Card>
            </section>

            {/* Markets */}
            <section className="space-y-3">
              <h2 className="text-lg font-semibold">Active markets — force resolve</h2>
              <Card className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-xs text-muted-foreground border-b border-border">
                    <tr><th className="text-left p-3">Question</th><th className="text-left p-3">Category</th><th className="text-right p-3">Volume</th><th className="text-right p-3">YES</th><th className="text-right p-3">Actions</th></tr>
                  </thead>
                  <tbody>
                    {markets.slice(0, 50).map(m => (
                      <tr key={m.id} className="border-b border-border/50">
                        <td className="p-3 max-w-md truncate">{m.question}</td>
                        <td className="p-3"><Badge variant="outline">{m.category}</Badge></td>
                        <td className="p-3 text-right">{formatVolume(Number(m.volume))}</td>
                        <td className="p-3 text-right">{Math.round(Number(m.yes_odds))}%</td>
                        <td className="p-3 text-right space-x-1 whitespace-nowrap">
                          <Button size="sm" variant="outline" onClick={() => resolve(m.id, "Yes")}>
                            <CheckCircle2 className="w-3 h-3 mr-1" /> Yes wins
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => resolve(m.id, "No")}>
                            <XCircle className="w-3 h-3 mr-1" /> No wins
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
