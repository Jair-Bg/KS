import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "./ui/button";
import { BetModal } from "./BetModal";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";

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

          <div className="h-64 lg:h-auto">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 8, left: -12, bottom: 0 }}>
                <defs>
                  <linearGradient id="fmSeattleFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(166, 100%, 45%)" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="hsl(166, 100%, 45%)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="fmNeFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(28, 95%, 60%)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="hsl(28, 95%, 60%)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="fmSeattleStroke" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="hsl(172, 90%, 48%)" />
                    <stop offset="100%" stopColor="hsl(160, 100%, 42%)" />
                  </linearGradient>
                  <linearGradient id="fmNeStroke" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="hsl(340, 85%, 60%)" />
                    <stop offset="100%" stopColor="hsl(28, 95%, 58%)" />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="hsl(220, 13%, 91%)" strokeDasharray="3 6" vertical={false} opacity={0.6} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(220, 9%, 46%)' }} />
                <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(220, 9%, 46%)' }} tickFormatter={(value) => `${value}%`} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(0, 0%, 100%)', border: '1px solid hsl(220, 13%, 91%)', borderRadius: 12, fontSize: 12, boxShadow: '0 12px 40px -12px hsl(220 24% 10% / 0.15)' }} />
                <Area type="monotone" dataKey="seattle" stroke="url(#fmSeattleStroke)" strokeWidth={2.5} fill="url(#fmSeattleFill)" name="Seattle" />
                <Area type="monotone" dataKey="newEngland" stroke="url(#fmNeStroke)" strokeWidth={2.5} fill="url(#fmNeFill)" name="New England" />
              </AreaChart>
            </ResponsiveContainer>
            <div className="flex items-center justify-end gap-6 mt-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ background: 'linear-gradient(135deg, hsl(172,90%,48%), hsl(160,100%,42%))' }}></span>
                <span>Seattle <span className="font-semibold">68%</span></span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ background: 'linear-gradient(135deg, hsl(340,85%,60%), hsl(28,95%,58%))' }}></span>
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
