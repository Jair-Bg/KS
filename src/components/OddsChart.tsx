import { useState, useEffect, useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface OddsPoint {
  market_id: string;
  option_name: string;
  odds: number;
  volume_at_time: number;
  recorded_at: string;
}

interface OddsChartProps {
  marketId: string;
  height?: number;
}

const OPTION_COLORS = [
  "hsl(166, 100%, 39%)",  // primary teal
  "hsl(220, 70%, 55%)",   // blue
  "hsl(340, 75%, 55%)",   // pink
  "hsl(45, 90%, 50%)",    // gold
  "hsl(280, 65%, 55%)",   // purple
  "hsl(160, 60%, 45%)",   // green
  "hsl(15, 80%, 55%)",    // orange
];

export function OddsChart({ marketId, height = 240 }: OddsChartProps) {
  const [data, setData] = useState<OddsPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: history, error } = await supabase
        .from("odds_history")
        .select("*")
        .eq("market_id", marketId)
        .order("recorded_at", { ascending: true });

      if (!error && history) {
        setData(history as OddsPoint[]);
      }
      setLoading(false);
    }
    load();
  }, [marketId]);

  const { chartData, optionNames } = useMemo(() => {
    if (!data.length) return { chartData: [], optionNames: [] };

    const names = [...new Set(data.map((d) => d.option_name))];

    // Group by timestamp
    const grouped = new Map<string, Record<string, number>>();
    for (const point of data) {
      const key = point.recorded_at;
      if (!grouped.has(key)) grouped.set(key, {});
      grouped.get(key)![point.option_name] = point.odds;
    }

    const chartData = Array.from(grouped.entries()).map(([time, odds]) => ({
      time: new Date(time).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      rawTime: time,
      ...odds,
    }));

    return { chartData, optionNames: names };
  }, [data]);

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </div>
    );
  }

  if (!chartData.length) {
    return (
      <div className="flex items-center justify-center text-sm text-muted-foreground" style={{ height }}>
        No trading history yet
      </div>
    );
  }

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            dataKey="time"
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            axisLine={{ stroke: "hsl(var(--border))" }}
            tickLine={false}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            axisLine={{ stroke: "hsl(var(--border))" }}
            tickLine={false}
            tickFormatter={(v) => `${v}%`}
          />
          <Tooltip
            contentStyle={{
              background: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "12px",
              fontSize: "12px",
              boxShadow: "0 8px 30px -8px hsl(var(--foreground) / 0.1)",
            }}
            formatter={(value: number, name: string) => [`${value.toFixed(1)}%`, name]}
          />
          {optionNames.length > 2 && (
            <Legend
              wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
            />
          )}
          {optionNames.map((name, i) => (
            <Line
              key={name}
              type="monotone"
              dataKey={name}
              stroke={OPTION_COLORS[i % OPTION_COLORS.length]}
              strokeWidth={2}
              dot={{ r: 3, fill: OPTION_COLORS[i % OPTION_COLORS.length] }}
              activeDot={{ r: 5 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
