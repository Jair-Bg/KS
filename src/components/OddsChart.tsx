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
        <AreaChart data={data} margin={{ top: 10, right: 8, left: -12, bottom: 0 }}>
          <defs>
            <linearGradient id="yesGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(166, 100%, 45%)" stopOpacity={0.45} />
              <stop offset="100%" stopColor="hsl(166, 100%, 45%)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="noGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(280, 85%, 62%)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="hsl(280, 85%, 62%)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="yesStroke" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="hsl(172, 90%, 48%)" />
              <stop offset="100%" stopColor="hsl(160, 100%, 42%)" />
            </linearGradient>
            <linearGradient id="noStroke" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="hsl(300, 85%, 65%)" />
              <stop offset="100%" stopColor="hsl(260, 90%, 62%)" />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 6" vertical={false} opacity={0.4} />
          <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
          <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => `${v}%`} />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: 12,
              fontSize: 12,
              boxShadow: "0 12px 40px -12px hsl(var(--foreground) / 0.25)",
            }}
          />
          <Area type="monotone" dataKey="yes" stroke="url(#yesStroke)" strokeWidth={2.5} fill="url(#yesGrad)" name="Yes" isAnimationActive={false} />
          <Area type="monotone" dataKey="no" stroke="url(#noStroke)" strokeWidth={2.5} fill="url(#noGrad)" name="No" isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
