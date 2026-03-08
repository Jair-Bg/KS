import { ChevronRight } from "lucide-react";
import { MarketCard } from "./MarketCard";

interface MarketSectionProps {
  title: string;
  markets: {
    id?: string;
    title: string;
    subtitle?: string;
    options: { name: string; payout: string; odds: number; icon?: string }[];
    volume?: string;
    marketsCount?: number;
  }[];
}

export function MarketSection({ title, markets }: MarketSectionProps) {
  return (
    <section className="animate-slide-up">
      <div className="section-title mb-4">
        <span>{title}</span>
        <ChevronRight className="w-4 h-4 text-primary" />
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {markets.map((market, index) => (
          <MarketCard key={market.id || index} {...market} />
        ))}
      </div>
    </section>
  );
}
