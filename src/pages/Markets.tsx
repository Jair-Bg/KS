import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { MarketSection } from "@/components/MarketSection";
import { TrendingSidebar } from "@/components/TrendingSidebar";
import { fetchMarkets, formatVolume, marketToOptions, type Market } from "@/lib/api";
import { Loader2 } from "lucide-react";

export default function Markets() {
  const [activeCategory, setActiveCategory] = useState("trending");
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchMarkets(activeCategory)
      .then((data) => {
        if (!cancelled) {
          setMarkets(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [activeCategory]);

  // Group markets by category for display
  const grouped = markets.reduce<Record<string, Market[]>>((acc, m) => {
    const cat = m.category || "other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(m);
    return acc;
  }, {});

  const sections = Object.entries(grouped).map(([category, items]) => ({
    title: category.charAt(0).toUpperCase() + category.slice(1),
    markets: items.map((m) => ({
      id: m.id,
      title: m.question,
      options: marketToOptions(m),
      volume: formatVolume(m.volume),
    })),
  }));

  return (
    <div className="min-h-screen bg-background">
      <Header activeCategory={activeCategory} onCategoryChange={setActiveCategory} />
      <main className="container py-6">
        <div className="grid lg:grid-cols-[1fr,320px] gap-8">
          <div className="space-y-8">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : sections.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-muted-foreground">No markets found in this category yet.</p>
                <p className="text-sm text-muted-foreground mt-2">
                  <a href="/create" className="text-primary hover:underline">Create the first one →</a>
                </p>
              </div>
            ) : (
              sections.map((section, i) => (
                <MarketSection key={`${activeCategory}-${i}`} title={section.title} markets={section.markets} />
              ))
            )}
          </div>
          <div className="hidden lg:block">
            <TrendingSidebar />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
