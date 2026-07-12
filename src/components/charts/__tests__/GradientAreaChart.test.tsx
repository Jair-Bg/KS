import { describe, it, expect, vi } from "vitest";
import { cloneElement, isValidElement } from "react";
import { render } from "@testing-library/react";

// Force Recharts' ResponsiveContainer to render at a fixed size in jsdom so
// the underlying <svg> (and its <linearGradient> defs) actually mount.
vi.mock("recharts", async () => {
  const actual = await vi.importActual<typeof import("recharts")>("recharts");
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div style={{ width: 600, height: 300 }}>
        {isValidElement(children)
          ? cloneElement(children as any, { width: 600, height: 300 })
          : children}
      </div>
    ),
  };
});


import {
  GradientAreaChart,
  CHART_PALETTE,
  paletteSwatch,
  type SeriesKey,
} from "../GradientAreaChart";

// Recharts uses ResponsiveContainer which needs measurable dimensions in jsdom.
// Wrap in a sized parent so <svg> renders.
function Sized({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ width: 600, height: 300 }}>
      {children}
    </div>
  );
}

const sampleData = [
  { t: "Jan", a: 40, b: 60 },
  { t: "Feb", a: 50, b: 50 },
  { t: "Mar", a: 65, b: 35 },
];

function renderChart(series: { dataKey: string; name: string; color: SeriesKey }[], idPrefix = "test") {
  return render(
    <Sized>
      <GradientAreaChart data={sampleData} xKey="t" idPrefix={idPrefix} series={series} />
    </Sized>,
  );
}

describe("CHART_PALETTE", () => {
  it("defines all expected market palette keys", () => {
    const keys: SeriesKey[] = ["yes", "no", "teal", "purple", "orange", "magenta"];
    for (const k of keys) {
      expect(CHART_PALETTE[k]).toBeDefined();
      expect(CHART_PALETTE[k].fillStops).toHaveLength(2);
      expect(CHART_PALETTE[k].strokeStops).toHaveLength(2);
      expect(CHART_PALETTE[k].swatch).toMatch(/linear-gradient/);
    }
  });

  it("uses matching stroke colors for yes/teal (binary YES market)", () => {
    expect(CHART_PALETTE.yes.strokeStops).toEqual(CHART_PALETTE.teal.strokeStops);
  });

  it("uses matching stroke colors for no/purple (binary NO market)", () => {
    expect(CHART_PALETTE.no.strokeStops).toEqual(CHART_PALETTE.purple.strokeStops);
  });

  it("distinguishes yes vs no strokes", () => {
    expect(CHART_PALETTE.yes.strokeStops).not.toEqual(CHART_PALETTE.no.strokeStops);
  });

  it("exposes swatch gradient via paletteSwatch()", () => {
    expect(paletteSwatch("teal")).toBe(CHART_PALETTE.teal.swatch);
    expect(paletteSwatch("orange")).toBe(CHART_PALETTE.orange.swatch);
  });
});

describe("GradientAreaChart rendering", () => {
  it("renders one fill + stroke gradient per series with unique ids", () => {
    const { container } = renderChart(
      [
        { dataKey: "a", name: "Yes", color: "yes" },
        { dataKey: "b", name: "No", color: "no" },
      ],
      "odds-m1",
    );

    const gradients = container.querySelectorAll("linearGradient");
    const ids = Array.from(gradients).map((g) => g.getAttribute("id"));

    expect(ids).toContain("odds-m1-a-fill");
    expect(ids).toContain("odds-m1-a-stroke");
    expect(ids).toContain("odds-m1-b-fill");
    expect(ids).toContain("odds-m1-b-stroke");
  });

  it.each([
    ["yes", "yes"],
    ["no", "no"],
    ["teal", "teal"],
    ["purple", "purple"],
    ["orange", "orange"],
    ["magenta", "magenta"],
  ] as [SeriesKey, string][])(
    "applies the %s palette stops when color=%s",
    (color) => {
      const { container } = renderChart(
        [{ dataKey: "a", name: color, color }],
        `p-${color}`,
      );

      const palette = CHART_PALETTE[color];
      const fill = container.querySelector(`#p-${color}-a-fill`);
      const stroke = container.querySelector(`#p-${color}-a-stroke`);
      expect(fill).toBeTruthy();
      expect(stroke).toBeTruthy();

      const fillStops = fill!.querySelectorAll("stop");
      expect(fillStops[0].getAttribute("stop-color")).toBe(palette.fillStops[0]);
      expect(fillStops[1].getAttribute("stop-color")).toBe(palette.fillStops[1]);
      expect(Number(fillStops[0].getAttribute("stop-opacity"))).toBeCloseTo(palette.fillOpacity);

      const strokeStops = stroke!.querySelectorAll("stop");
      expect(strokeStops[0].getAttribute("stop-color")).toBe(palette.strokeStops[0]);
      expect(strokeStops[1].getAttribute("stop-color")).toBe(palette.strokeStops[1]);
    },
  );

  it("scopes gradient ids by idPrefix so multiple charts on one page don't collide", () => {
    const { container } = render(
      <Sized>
        <GradientAreaChart
          data={sampleData}
          xKey="t"
          idPrefix="chart-A"
          series={[{ dataKey: "a", name: "Yes", color: "yes" }]}
        />
        <GradientAreaChart
          data={sampleData}
          xKey="t"
          idPrefix="chart-B"
          series={[{ dataKey: "a", name: "Yes", color: "yes" }]}
        />
      </Sized>,
    );

    expect(container.querySelector("#chart-A-a-fill")).toBeTruthy();
    expect(container.querySelector("#chart-B-a-fill")).toBeTruthy();
  });
});
