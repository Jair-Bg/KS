import { useEffect, useState } from "react";

interface OddsChartProps {
  marketId: string;
  height?: number;
}

export function OddsChart({ marketId: _marketId, height = 240 }: OddsChartProps) {
  const [loading, setLoading] = useState(true);
  useEffect(() => { setLoading(false); }, []);

  return (
    <div className="flex items-center justify-center text-sm text-muted-foreground" style={{ height }}>
      {loading ? "Loading…" : "No price history available"}
    </div>
  );
}
