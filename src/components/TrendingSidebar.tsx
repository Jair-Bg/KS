import { ChevronRight, TrendingUp, TrendingDown } from "lucide-react";
import { useEffect, useState } from "react";
import { fetchMarkets, formatVolume, type Market } from "@/lib/api";
import { Link } from "react-router-dom";

interface TrendingItem {
  id: string;
  rank: number;
  title: string;
  subtitle?: string;
  odds: number;
  change: number;
}

function toItems(markets: Market[]): TrendingItem[] {
  return markets.slice(0, 3).map((m, i) => ({
    id: m.id,
    rank: i + 1,
    title: m.question,
    subtitle: formatVolume(m.volume) + " vol",
    odds: Math.round(m.yes_odds ?? 50),
    change: 0,
  }));
}

function TrendingSection({ title, items }: { title: string; items: TrendingItem[] }) {
  if (items.length === 0) return null;
  return (
    <div className="mb-8">
      <div className="section-title mb-4 flex items-center justify-between">
        <span>{title}</span>
        <ChevronRight className="w-4 h-4 text-primary" />
      </div>
      <div>
        {items.map((item) => (
          <Link to={`/market/${item.id}`} key={item.id} className="trending-item block">
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
          </Link>
        ))}
      </div>
    </div>
  );
}

export function TrendingSidebar() {
  const [items, setItems] = useState<TrendingItem[]>([]);

  useEffect(() => {
    fetchMarkets()
      .then((markets) => {
        const sorted = [...markets].sort((a, b) => (b.volume ?? 0) - (a.volume ?? 0));
        setItems(toItems(sorted));
      })
      .catch(() => setItems([]));
  }, []);

  if (items.length === 0) {
    return (
      <aside>
        <div className="section-title mb-4">By volume</div>
        <p className="text-sm text-muted-foreground">No markets yet.</p>
      </aside>
    );
  }

  return (
    <aside className="space-y-2">
      <TrendingSection title="By volume" items={items} />
    </aside>
  );
}
