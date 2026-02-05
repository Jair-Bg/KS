import { ChevronRight, TrendingUp, TrendingDown } from "lucide-react";

interface TrendingItem {
  rank: number;
  title: string;
  subtitle?: string;
  odds: number;
  change: number;
}

const trendingItems: TrendingItem[] = [
  { rank: 1, title: "Who will be next Fed chair?", subtitle: "Kevin Warsh", odds: 41, change: -1 },
  { rank: 2, title: "Bitcoin price tomorrow at 5pm EST?", subtitle: "$72,250 or above", odds: 39, change: -46 },
  { rank: 3, title: "Ali Khamenei out as Supreme Leader?", subtitle: "Before September 1, 2026", odds: 38, change: 3 },
];

const topMovers: TrendingItem[] = [
  { rank: 1, title: "Who will perform at the Big Game?", subtitle: "Ricky Martin", odds: 79, change: 76 },
  { rank: 2, title: "Who will headline Govball?", subtitle: "A$AP Rocky", odds: 2, change: -97 },
  { rank: 3, title: "Anthony Davis's next team?", subtitle: "Washington", odds: 97, change: 96 },
];

const newMarkets: TrendingItem[] = [
  { rank: 1, title: "What will KKR say during their next earnings call?", subtitle: "Tariff", odds: 54, change: 54 },
  { rank: 2, title: "Which sectors will Trump tariff this year?", subtitle: "Critical minerals", odds: 43, change: 43 },
  { rank: 3, title: "What will the US tariff rate on the EU be on July 1?", subtitle: "Between 10% and 19.99%", odds: 53, change: 53 },
];

function TrendingSection({ title, items, showNew = false }: { title: string; items: TrendingItem[]; showNew?: boolean }) {
  return (
    <div className="mb-8">
      <div className="section-title mb-4">
        <span>{title}</span>
        <ChevronRight className="w-4 h-4 text-primary" />
      </div>
      <div>
        {items.map((item) => (
          <div key={item.rank} className="trending-item">
            <div className="flex items-start gap-3 min-w-0">
              <span className="text-sm text-muted-foreground font-medium shrink-0 w-4">{item.rank}</span>
              <div className="min-w-0">
                <p className="text-sm font-medium leading-tight truncate">{item.title}</p>
                {item.subtitle && (
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{item.subtitle}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-sm font-semibold">{item.odds}%</span>
              <div className={`flex items-center text-xs ${item.change >= 0 ? 'chart-up' : 'chart-down'}`}>
                {item.change >= 0 ? (
                  <TrendingUp className="w-3 h-3 mr-0.5" />
                ) : (
                  <TrendingDown className="w-3 h-3 mr-0.5" />
                )}
                <span>{Math.abs(item.change)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function TrendingSidebar() {
  return (
    <aside className="space-y-2">
      <TrendingSection title="Trending" items={trendingItems} />
      <TrendingSection title="Top movers" items={topMovers} />
      <TrendingSection title="New" items={newMarkets} showNew />
    </aside>
  );
}
