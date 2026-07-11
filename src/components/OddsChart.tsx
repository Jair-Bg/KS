import { useEffect, useState } from "react";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
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

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const { data: rows, error } = await supabase
        .from("odds_history")
        .select("yes_odds, no_odds, recorded_at")
        .eq("market_id", marketId)
        .order("recorded_at", { ascending: true });
      if (error || cancelled) return;
      setData(
        (rows ?? []).map((d: any) => ({
          time: new Date(d.recorded_at).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
          yes: Number(d.yes_odds),
          no: Number(d.no_odds),
        })),
      );
    };

    load();

    const channel = supabase
      .channel(`odds-${marketId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "odds_history", filter: `market_id=eq.${marketId}` },
        (payload: any) => {
          const d = payload.new;
          setData((prev) => [
            ...prev,
            {
              time: new Date(d.recorded_at).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
              yes: Number(d.yes_odds),
              no: Number(d.no_odds),
            },
          ]);
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [marketId]);

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
          <Line type="monotone" dataKey="yes" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} name="Yes" isAnimationActive={false} />
          <Line type="monotone" dataKey="no" stroke="hsl(var(--muted-foreground))" strokeWidth={2} dot={false} strokeDasharray="5 5" name="No" isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
