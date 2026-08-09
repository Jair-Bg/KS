import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Loader2, Plug, RefreshCw } from "lucide-react";

type LogRow = {
  id: string;
  created_at: string;
  tool_name: string;
  client_id: string | null;
  arguments: Record<string, unknown> | null;
  success: boolean;
  error_message: string | null;
  duration_ms: number;
};

export default function AdminMcpLogs() {
  const [rows, setRows] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [onlyErrors, setOnlyErrors] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("mcp_tool_logs" as never)
      .select("id,created_at,tool_name,client_id,arguments,success,error_message,duration_ms")
      .order("created_at", { ascending: false })
      .limit(500);
    setRows((data as unknown as LogRow[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(
    () =>
      rows.filter((r) => {
        if (onlyErrors && r.success) return false;
        if (!q) return true;
        const hay = `${r.tool_name} ${r.client_id ?? ""} ${r.error_message ?? ""} ${JSON.stringify(r.arguments ?? {})}`;
        return hay.toLowerCase().includes(q.toLowerCase());
      }),
    [rows, q, onlyErrors],
  );

  const stats = useMemo(() => {
    const total = rows.length;
    const errors = rows.filter((r) => !r.success).length;
    const durations = rows.map((r) => r.duration_ms).sort((a, b) => a - b);
    const avg = total ? Math.round(durations.reduce((s, d) => s + d, 0) / total) : 0;
    const p95 = total ? durations[Math.min(durations.length - 1, Math.floor(durations.length * 0.95))] : 0;
    return { total, errors, avg, p95 };
  }, [rows]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container max-w-6xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Plug className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold">MCP Tool Calls</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={load} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-1 ${loading ? "animate-spin" : ""}`} /> Refresh
            </Button>
            <Link to="/admin">
              <Button variant="outline" size="sm">Back to admin</Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            ["Invocations", stats.total],
            ["Errors", stats.errors],
            ["Avg latency", `${stats.avg} ms`],
            ["p95 latency", `${stats.p95} ms`],
          ].map(([label, value]) => (
            <Card key={label as string} className="p-4">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-xl font-bold">{value}</p>
            </Card>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Input
            placeholder="Search tool, client or error…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="max-w-md"
          />
          <Button variant={onlyErrors ? "default" : "outline"} size="sm" onClick={() => setOnlyErrors((v) => !v)}>
            Errors only
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="animate-spin text-primary" /></div>
        ) : filtered.length === 0 ? (
          <Card className="p-8 text-center text-sm text-muted-foreground">No MCP tool calls recorded yet.</Card>
        ) : (
          <Card className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-muted-foreground border-b border-border">
                <tr>
                  <th className="text-left p-3">Time</th>
                  <th className="text-left p-3">Tool</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-right p-3">Latency</th>
                  <th className="text-left p-3">Client</th>
                  <th className="text-left p-3">Arguments / Error</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className="border-b border-border/50 align-top">
                    <td className="p-3 whitespace-nowrap text-muted-foreground">
                      {new Date(r.created_at).toLocaleString()}
                    </td>
                    <td className="p-3 font-mono text-xs">{r.tool_name}</td>
                    <td className="p-3">
                      <Badge variant={r.success ? "secondary" : "destructive"}>{r.success ? "OK" : "Error"}</Badge>
                    </td>
                    <td className="p-3 text-right tabular-nums">{r.duration_ms} ms</td>
                    <td className="p-3 text-xs text-muted-foreground">{r.client_id ?? "—"}</td>
                    <td className="p-3 text-xs max-w-md">
                      {r.success ? (
                        <code className="text-muted-foreground break-all">{JSON.stringify(r.arguments ?? {})}</code>
                      ) : (
                        <span className="text-destructive break-all">{r.error_message}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </main>
    </div>
  );
}
