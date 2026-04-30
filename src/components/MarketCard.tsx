import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bookmark } from "lucide-react";
import { Button } from "./ui/button";
import { BetModal } from "./BetModal";
import { useWatchlist } from "@/hooks/useWatchlist";

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
  const navigate = useNavigate();
  const { isWatching, toggle } = useWatchlist();
  const watching = id ? isWatching(id) : false;
  const handleOddsClick = (e: React.MouseEvent, index: number, option: MarketOption) => {
    e.stopPropagation();
    if (selectedIndex === index) {
      setSelectedIndex(null);
    } else {
      setSelectedIndex(index);
      setBetModal({ option });
    }
  };

  const handleCardClick = () => {
    if (id) navigate(`/market/${id}`);
  };

  return (
    <>
      <div className="market-card animate-fade-in cursor-pointer" onClick={handleCardClick}>
        <div className="flex items-start justify-between mb-4 gap-3">
          <div className="min-w-0">
            <h3 className="font-semibold text-foreground leading-tight">{title}</h3>
            {subtitle && (
              <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
            )}
          </div>
          {id && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); toggle(id); }}
              className={`shrink-0 p-1.5 rounded-md transition-colors ${
                watching ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
              aria-label={watching ? "Remove from watchlist" : "Save to watchlist"}
              title={watching ? "Remove from watchlist" : "Save to watchlist"}
            >
              <Bookmark className={`w-4 h-4 ${watching ? "fill-current" : ""}`} />
            </button>
          )}
        </div>
        <div className="space-y-2">
          {options.slice(0, 4).map((option, index) => (
            <div key={index} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 min-w-0">
                {option.icon && (
                  <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center shrink-0">
                    <span className="text-xs">{option.icon}</span>
                  </div>
                )}
                <span className="font-medium truncate text-sm">{option.name}</span>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-sm text-muted-foreground">{option.payout}</span>
                <Button
                  variant={selectedIndex === index ? "oddsActive" : "odds"}
                  size="pill"
                  className="min-w-[60px]"
                  onClick={(e) => handleOddsClick(e, index, option)}
                >
                  {option.odds}%
                </Button>
              </div>
            </div>
          ))}
          {options.length > 4 && (
            <p className="text-xs text-muted-foreground text-right">
              +{options.length - 4} more outcomes
            </p>
          )}
        </div>

        <div className="flex items-center justify-between mt-4 pt-3 border-t border-border text-sm">
          {volume && (
            <span className="text-muted-foreground">{volume} vol</span>
          )}
          {marketsCount && (
            <span className="text-primary text-xs">
              {marketsCount} markets
            </span>
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
