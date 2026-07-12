import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { GradientAreaChart } from "@/components/charts/GradientAreaChart";

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
    <GradientAreaChart
      data={data}
      xKey="time"
      height={height}
      idPrefix={`odds-${marketId}`}
      series={[
        { dataKey: "yes", name: "Yes", color: "yes" },
        { dataKey: "no", name: "No", color: "no" },
      ]}
    />
  );
}
