import { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { MarketSection } from "@/components/MarketSection";
import { TrendingSidebar } from "@/components/TrendingSidebar";

const allMarkets: Record<string, { title: string; markets: { id?: string; title: string; subtitle?: string; options: { name: string; payout: string; odds: number; icon?: string }[]; volume?: string; marketsCount?: number }[] }[]> = {
  trending: [
    {
      title: "Pro Football",
      markets: [
        { title: "Which brands will advertise during the Big Game?", options: [{ name: "Paramount+", payout: "2.01x", odds: 48 }, { name: "Disney+", payout: "1.97x", odds: 49 }], volume: "$8,147,083", marketsCount: 28 },
        { title: "Championship: Seattle vs New England", subtitle: "Feb 8 @ 6:30PM", options: [{ name: "Seattle", payout: "1.44x", odds: 68, icon: "🏈" }, { name: "New England", payout: "2.89x", odds: 33, icon: "🏈" }], volume: "$165,670,111", marketsCount: 2 },
      ],
    },
    {
      title: "Politics",
      markets: [
        { title: "Will Trump visit China in 2025?", options: [{ name: "Yes", payout: "3.33x", odds: 29 }, { name: "No", payout: "1.39x", odds: 71 }], volume: "$2,341,000" },
        { title: "Federal government shutdown before April?", options: [{ name: "Yes", payout: "2.50x", odds: 38 }, { name: "No", payout: "1.59x", odds: 62 }], volume: "$5,123,000" },
      ],
    },
    {
      title: "Crypto",
      markets: [
        { title: "Bitcoin above $100k by end of February?", options: [{ name: "Yes", payout: "4.00x", odds: 24 }, { name: "No", payout: "1.30x", odds: 76 }], volume: "$12,450,000" },
        { title: "Ethereum ETF approval by Q2 2025?", options: [{ name: "Yes", payout: "1.85x", odds: 52 }, { name: "No", payout: "2.08x", odds: 48 }], volume: "$8,900,000" },
      ],
    },
  ],
  politics: [
    {
      title: "Politics",
      markets: [
        { title: "Will Trump visit China in 2025?", options: [{ name: "Yes", payout: "3.33x", odds: 29 }, { name: "No", payout: "1.39x", odds: 71 }], volume: "$2,341,000" },
        { title: "Federal government shutdown before April?", options: [{ name: "Yes", payout: "2.50x", odds: 38 }, { name: "No", payout: "1.59x", odds: 62 }], volume: "$5,123,000" },
        { title: "Will there be a new Supreme Court justice in 2025?", options: [{ name: "Yes", payout: "5.00x", odds: 19 }, { name: "No", payout: "1.22x", odds: 81 }], volume: "$1,890,000" },
        { title: "US midterm voter turnout above 50%?", options: [{ name: "Yes", payout: "2.10x", odds: 46 }, { name: "No", payout: "1.82x", odds: 54 }], volume: "$3,200,000" },
      ],
    },
  ],
  sports: [
    {
      title: "Pro Football",
      markets: [
        { title: "Championship: Seattle vs New England", subtitle: "Feb 8 @ 6:30PM", options: [{ name: "Seattle", payout: "1.44x", odds: 68, icon: "🏈" }, { name: "New England", payout: "2.89x", odds: 33, icon: "🏈" }], volume: "$165,670,111", marketsCount: 2 },
        { title: "Which brands will advertise during the Big Game?", options: [{ name: "Paramount+", payout: "2.01x", odds: 48 }, { name: "Disney+", payout: "1.97x", odds: 49 }], volume: "$8,147,083", marketsCount: 28 },
      ],
    },
  ],
  crypto: [
    {
      title: "Crypto",
      markets: [
        { title: "Bitcoin above $100k by end of February?", options: [{ name: "Yes", payout: "4.00x", odds: 24 }, { name: "No", payout: "1.30x", odds: 76 }], volume: "$12,450,000" },
        { title: "Ethereum ETF approval by Q2 2025?", options: [{ name: "Yes", payout: "1.85x", odds: 52 }, { name: "No", payout: "2.08x", odds: 48 }], volume: "$8,900,000" },
        { title: "Solana flips Ethereum in daily transactions?", options: [{ name: "Yes", payout: "3.00x", odds: 32 }, { name: "No", payout: "1.45x", odds: 68 }], volume: "$4,200,000" },
        { title: "Will a major exchange get hacked in 2025?", options: [{ name: "Yes", payout: "6.00x", odds: 16 }, { name: "No", payout: "1.18x", odds: 84 }], volume: "$1,100,000" },
      ],
    },
  ],
  culture: [
    {
      title: "Culture",
      markets: [
        { title: "Will Taylor Swift announce a new album in 2025?", options: [{ name: "Yes", payout: "1.50x", odds: 65 }, { name: "No", payout: "2.80x", odds: 35 }], volume: "$3,400,000" },
        { title: "Oscar for Best Picture 2026?", options: [{ name: "The Brutalist", payout: "2.20x", odds: 44 }, { name: "Anora", payout: "3.10x", odds: 31 }], volume: "$1,800,000" },
      ],
    },
  ],
  climate: [
    {
      title: "Climate",
      markets: [
        { title: "2025 hottest year on record?", options: [{ name: "Yes", payout: "1.30x", odds: 75 }, { name: "No", payout: "3.80x", odds: 25 }], volume: "$2,100,000" },
        { title: "Category 5 hurricane hits US in 2025?", options: [{ name: "Yes", payout: "2.60x", odds: 37 }, { name: "No", payout: "1.55x", odds: 63 }], volume: "$950,000" },
      ],
    },
  ],
  economics: [
    {
      title: "Economics",
      markets: [
        { title: "Fed cuts rates before July 2025?", options: [{ name: "Yes", payout: "1.70x", odds: 57 }, { name: "No", payout: "2.30x", odds: 43 }], volume: "$7,600,000" },
        { title: "US recession in 2025?", options: [{ name: "Yes", payout: "3.50x", odds: 28 }, { name: "No", payout: "1.37x", odds: 72 }], volume: "$9,800,000" },
      ],
    },
  ],
  companies: [
    {
      title: "Companies",
      markets: [
        { title: "Apple reaches $4T market cap in 2025?", options: [{ name: "Yes", payout: "2.00x", odds: 49 }, { name: "No", payout: "1.96x", odds: 51 }], volume: "$5,300,000" },
        { title: "TikTok banned in US by mid-2025?", options: [{ name: "Yes", payout: "4.50x", odds: 21 }, { name: "No", payout: "1.25x", odds: 79 }], volume: "$11,200,000" },
      ],
    },
  ],
  financials: [
    {
      title: "Financials",
      markets: [
        { title: "S&P 500 above 6000 by June?", options: [{ name: "Yes", payout: "1.60x", odds: 61 }, { name: "No", payout: "2.50x", odds: 39 }], volume: "$6,400,000" },
        { title: "Gold above $2500/oz by March?", options: [{ name: "Yes", payout: "1.90x", odds: 51 }, { name: "No", payout: "2.05x", odds: 49 }], volume: "$3,700,000" },
      ],
    },
  ],
  tech: [
    {
      title: "Tech & Science",
      markets: [
        { title: "GPT-5 released before July 2025?", options: [{ name: "Yes", payout: "2.40x", odds: 40 }, { name: "No", payout: "1.65x", odds: 60 }], volume: "$4,800,000" },
        { title: "SpaceX Starship reaches orbit in 2025?", options: [{ name: "Yes", payout: "1.40x", odds: 70 }, { name: "No", payout: "3.20x", odds: 30 }], volume: "$2,900,000" },
      ],
    },
  ],
};

export default function Markets() {
  const [activeCategory, setActiveCategory] = useState("trending");

  const sections = allMarkets[activeCategory] || allMarkets.trending;

  return (
    <div className="min-h-screen bg-background">
      <Header activeCategory={activeCategory} onCategoryChange={setActiveCategory} />
      <main className="container py-6">
        <div className="grid lg:grid-cols-[1fr,320px] gap-8">
          <div className="space-y-8">
            {sections.map((section, i) => (
              <MarketSection key={`${activeCategory}-${i}`} title={section.title} markets={section.markets} />
            ))}
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
