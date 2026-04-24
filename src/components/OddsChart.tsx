import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { supabase } from "@/integrations/supabase/client";

interface OddsChartProps {
  marketId: string;
  height?: number;
}

interface Point {
  time: string;
  yes: number;
  no: number;
}

export function OddsChart({ marketId, height = 240 }: OddsChartProps) {
  const [data, setData] = useState<Point[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from("odds_history")
      .select("yes_odds, no_odds, recorded_at")
      .eq("market_id", marketId)
      .order("recorded_at", { ascending: true })
      .limit(200)
      .then(({ data }) => {
        if (cancelled) return;
        setData(
          (data ?? []).map((d) => ({
            time: new Date(d.recorded_at).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
            yes: Number(d.yes_odds),
            no: Number(d.no_odds),
          })),
        );
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [marketId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center text-sm text-muted-foreground" style={{ height }}>
        Loading…
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center text-sm text-muted-foreground" style={{ height }}>
        No price history yet
      </div>
    );
  }

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
          <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => `${v}%`} />
          <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
          <Line type="monotone" dataKey="yes" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} name="Yes" />
          <Line type="monotone" dataKey="no" stroke="hsl(var(--muted-foreground))" strokeWidth={2} dot={false} strokeDasharray="5 5" name="No" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
