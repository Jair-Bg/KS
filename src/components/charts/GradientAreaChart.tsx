import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";

export type SeriesKey = "yes" | "no" | "teal" | "purple" | "orange" | "magenta";

export interface ChartSeries {
  /** Field name in the data objects */
  dataKey: string;
  /** Display name in the tooltip */
  name: string;
  /** Preset color palette to use for stroke + fill gradients */
  color: SeriesKey;
}

interface GradientAreaChartProps {
  data: Array<Record<string, any>>;
  xKey: string;
  series: ChartSeries[];
  height?: number;
  /** Unique id prefix so multiple charts on the same page don't collide */
  idPrefix?: string;
  yDomain?: [number, number];
  yTickFormatter?: (v: number) => string;
  gridColor?: string;
  axisTickColor?: string;
  tooltipBg?: string;
  tooltipBorder?: string;
  tooltipShadow?: string;
}

/**
 * Palette used across the app for market charts.
 * Each entry provides:
 *  - fill: vertical gradient (top -> transparent)
 *  - stroke: horizontal gradient for the line
 *  - swatch: solid CSS gradient for legends
 */
export const CHART_PALETTE: Record<
  SeriesKey,
  { fillStops: [string, string]; fillOpacity: number; strokeStops: [string, string]; swatch: string }
> = {
  yes: {
    fillStops: ["hsl(166, 100%, 45%)", "hsl(166, 100%, 45%)"],
    fillOpacity: 0.45,
    strokeStops: ["hsl(172, 90%, 48%)", "hsl(160, 100%, 42%)"],
    swatch: "linear-gradient(135deg, hsl(172,90%,48%), hsl(160,100%,42%))",
  },
  teal: {
    fillStops: ["hsl(166, 100%, 45%)", "hsl(166, 100%, 45%)"],
    fillOpacity: 0.45,
    strokeStops: ["hsl(172, 90%, 48%)", "hsl(160, 100%, 42%)"],
    swatch: "linear-gradient(135deg, hsl(172,90%,48%), hsl(160,100%,42%))",
  },
  no: {
    fillStops: ["hsl(280, 85%, 62%)", "hsl(280, 85%, 62%)"],
    fillOpacity: 0.35,
    strokeStops: ["hsl(300, 85%, 65%)", "hsl(260, 90%, 62%)"],
    swatch: "linear-gradient(135deg, hsl(300,85%,65%), hsl(260,90%,62%))",
  },
  purple: {
    fillStops: ["hsl(280, 85%, 62%)", "hsl(280, 85%, 62%)"],
    fillOpacity: 0.35,
    strokeStops: ["hsl(300, 85%, 65%)", "hsl(260, 90%, 62%)"],
    swatch: "linear-gradient(135deg, hsl(300,85%,65%), hsl(260,90%,62%))",
  },
  orange: {
    fillStops: ["hsl(28, 95%, 60%)", "hsl(28, 95%, 60%)"],
    fillOpacity: 0.4,
    strokeStops: ["hsl(340, 85%, 60%)", "hsl(28, 95%, 58%)"],
    swatch: "linear-gradient(135deg, hsl(340,85%,60%), hsl(28,95%,58%))",
  },
  magenta: {
    fillStops: ["hsl(320, 90%, 60%)", "hsl(320, 90%, 60%)"],
    fillOpacity: 0.4,
    strokeStops: ["hsl(320, 90%, 62%)", "hsl(280, 90%, 60%)"],
    swatch: "linear-gradient(135deg, hsl(320,90%,62%), hsl(280,90%,60%))",
  },
};

export function paletteSwatch(color: SeriesKey): string {
  return CHART_PALETTE[color].swatch;
}

export function GradientAreaChart({
  data,
  xKey,
  series,
  height = 240,
  idPrefix = "gac",
  yDomain = [0, 100],
  yTickFormatter = (v) => `${v}%`,
  gridColor = "hsl(var(--border))",
  axisTickColor = "hsl(var(--muted-foreground))",
  tooltipBg = "hsl(var(--card))",
  tooltipBorder = "hsl(var(--border))",
  tooltipShadow = "0 12px 40px -12px hsl(var(--foreground) / 0.25)",
}: GradientAreaChartProps) {
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 8, left: -12, bottom: 0 }}>
          <defs>
            {series.map((s) => {
              const p = CHART_PALETTE[s.color];
              const fillId = `${idPrefix}-${s.dataKey}-fill`;
              const strokeId = `${idPrefix}-${s.dataKey}-stroke`;
              return (
                <g key={s.dataKey}>
                  <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={p.fillStops[0]} stopOpacity={p.fillOpacity} />
                    <stop offset="100%" stopColor={p.fillStops[1]} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id={strokeId} x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor={p.strokeStops[0]} />
                    <stop offset="100%" stopColor={p.strokeStops[1]} />
                  </linearGradient>
                </g>
              );
            })}
          </defs>
          <CartesianGrid stroke={gridColor} strokeDasharray="3 6" vertical={false} opacity={0.5} />
          <XAxis
            dataKey={xKey}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: axisTickColor }}
          />
          <YAxis
            domain={yDomain}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: axisTickColor }}
            tickFormatter={yTickFormatter}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: tooltipBg,
              border: `1px solid ${tooltipBorder}`,
              borderRadius: 12,
              fontSize: 12,
              boxShadow: tooltipShadow,
            }}
          />
          {series.map((s) => (
            <Area
              key={s.dataKey}
              type="monotone"
              dataKey={s.dataKey}
              name={s.name}
              stroke={`url(#${idPrefix}-${s.dataKey}-stroke)`}
              strokeWidth={2.5}
              fill={`url(#${idPrefix}-${s.dataKey}-fill)`}
              isAnimationActive={false}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
