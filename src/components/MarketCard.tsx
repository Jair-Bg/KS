import { useState } from "react";
import { Button } from "./ui/button";
import { BetModal } from "./BetModal";

interface MarketOption {
  name: string;
  payout: string;
  odds: number;
  icon?: string;
}

interface MarketCardProps {
  id?: string;
  title: string;
  subtitle?: string;
  options: MarketOption[];
  volume?: string;
  marketsCount?: number;
}

export function MarketCard({ id, title, subtitle, options, volume, marketsCount }: MarketCardProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [betModal, setBetModal] = useState<{ option: MarketOption } | null>(null);

  const handleOddsClick = (index: number, option: MarketOption) => {
    if (selectedIndex === index) {
      setSelectedIndex(null);
    } else {
      setSelectedIndex(index);
      setBetModal({ option });
    }
  };

  return (
    <>
      <div className="market-card animate-fade-in">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-semibold text-foreground leading-tight">{title}</h3>
            {subtitle && (
              <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
            )}
          </div>
          <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
            🏈
          </div>
        </div>

        <div className="space-y-2">
          {options.slice(0, 2).map((option, index) => (
            <div key={index} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 min-w-0">
                {option.icon && (
                  <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center shrink-0">
                    <span className="text-xs">{option.icon}</span>
                  </div>
                )}
                <span className="font-medium truncate">{option.name}</span>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-sm text-muted-foreground">{option.payout}</span>
                <Button
                  variant={selectedIndex === index ? "oddsActive" : "odds"}
                  size="pill"
                  className="min-w-[60px]"
                  onClick={() => handleOddsClick(index, option)}
                >
                  {option.odds}%
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between mt-4 pt-3 border-t border-border text-sm">
          {volume && (
            <span className="text-muted-foreground">{volume} vol</span>
          )}
          {marketsCount && (
            <a href="#" className="text-primary hover:underline">
              {marketsCount} markets
            </a>
          )}
        </div>
      </div>

      {betModal && (
        <BetModal
          open={!!betModal}
          onClose={() => { setBetModal(null); setSelectedIndex(null); }}
          marketId={id || "unknown"}
          question={title}
          option={betModal.option.name}
          odds={betModal.option.odds}
          payout={betModal.option.payout}
        />
      )}
    </>
  );
}
