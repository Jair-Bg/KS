import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "./ui/button";
import { BetModal } from "./BetModal";
import { GradientAreaChart, paletteSwatch } from "./charts/GradientAreaChart";

const chartData = [
  { month: "Feb", seattle: 45, newEngland: 55 },
  { month: "May", seattle: 50, newEngland: 50 },
  { month: "Aug", seattle: 55, newEngland: 45 },
  { month: "Nov", seattle: 60, newEngland: 40 },
  { month: "Feb", seattle: 68, newEngland: 33 },
];

const options = [
  { name: "Seattle", payout: "1.44x", odds: 68 },
  { name: "New England", payout: "2.89x", odds: 33 },
];

export function FeaturedMarket() {
  const [betModal, setBetModal] = useState<{ name: string; odds: number; payout: string } | null>(null);

  return (
    <>
      <div className="market-card animate-fade-in">
        <div className="flex items-start justify-between mb-4">
          <h2 className="text-lg font-semibold">Championship: Seattle vs New England</h2>
          <span className="text-primary font-bold text-xl">Kastia</span>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div>
            <div className="grid grid-cols-3 gap-4 text-sm text-muted-foreground mb-4">
              <span>Market</span>
              <span className="text-center">Pays out</span>
              <span className="text-right">Odds</span>
            </div>

            <div className="space-y-3">
              {options.map((opt) => (
                <div key={opt.name} className="flex items-center justify-between">
                  <span className="font-medium">{opt.name}</span>
                  <span className="text-muted-foreground">{opt.payout}</span>
                  <Button
                    variant="odds"
                    size="pill"
                    className="min-w-[70px]"
                    onClick={() => setBetModal(opt)}
                  >
                    {opt.odds}%
                  </Button>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
              <span className="text-sm text-muted-foreground">$165,670,111 vol</span>
              <a href="/markets" className="text-sm text-primary hover:underline flex items-center gap-1">
                Spread and Total <ArrowRight className="w-3 h-3" />
              </a>
            </div>

            <div className="mt-4 pt-4 border-t border-border">
              <span className="text-sm font-medium text-muted-foreground">News</span>
              <p className="text-sm mt-2 text-foreground leading-relaxed">
                The pro football championship is less than a week away, with New England and Seattle set to meet in Santa Clara this Sunday, USA Today reports.
              </p>
            </div>
          </div>

          <div className="h-64 lg:h-auto flex flex-col">
            <div className="flex-1 min-h-[220px]">
              <GradientAreaChart
                data={chartData}
                xKey="month"
                height={240}
                idPrefix="fm"
                series={[
                  { dataKey: "seattle", name: "Seattle", color: "teal" },
                  { dataKey: "newEngland", name: "New England", color: "orange" },
                ]}
              />
            </div>
            <div className="flex items-center justify-end gap-6 mt-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ background: paletteSwatch("teal") }}></span>
                <span>Seattle <span className="font-semibold">68%</span></span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ background: paletteSwatch("orange") }}></span>
                <span>New England <span className="font-semibold">33%</span></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {betModal && (
        <BetModal
          open={!!betModal}
          onClose={() => setBetModal(null)}
          marketId="featured_001"
          question="Championship: Seattle vs New England"
          option={betModal.name}
          odds={betModal.odds}
          payout={betModal.payout}
        />
      )}
    </>
  );
}
