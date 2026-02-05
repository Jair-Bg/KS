import { Header } from "@/components/Header";
import { FeaturedMarket } from "@/components/FeaturedMarket";
import { MarketSection } from "@/components/MarketSection";
import { TrendingSidebar } from "@/components/TrendingSidebar";

const proFootballMarkets = [
  {
    title: "Which brands will advertise during the Big Game?",
    options: [
      { name: "Paramount+", payout: "2.01x", odds: 48 },
      { name: "Disney+", payout: "1.97x", odds: 49 },
    ],
    volume: "$8,147,083",
    marketsCount: 28,
  },
  {
    title: "Championship: Seattle vs New England",
    subtitle: "Feb 8 @ 6:30PM",
    options: [
      { name: "Seattle", payout: "1.44x", odds: 68, icon: "🏈" },
      { name: "New England", payout: "2.89x", odds: 33, icon: "🏈" },
    ],
    volume: "$165,670,111",
    marketsCount: 2,
  },
  {
    title: "Bad Bunny's halftime opener?",
    subtitle: "Feb 8 @ 6:30PM",
    options: [
      { name: "Tití Me Preguntó", payout: "1.76x", odds: 55 },
      { name: "BAILE INoLVIDABLE", payout: "6.29x", odds: 15 },
    ],
  },
  {
    title: "Pro Football Championship MVP?",
    options: [
      { name: "Sam Darnold", payout: "2.14x", odds: 45 },
      { name: "Drake Maye", payout: "3.52x", odds: 27 },
    ],
  },
];

const politicsMarkets = [
  {
    title: "Will Trump visit China in 2025?",
    options: [
      { name: "Yes", payout: "3.33x", odds: 29 },
      { name: "No", payout: "1.39x", odds: 71 },
    ],
    volume: "$2,341,000",
  },
  {
    title: "Federal government shutdown before April?",
    options: [
      { name: "Yes", payout: "2.50x", odds: 38 },
      { name: "No", payout: "1.59x", odds: 62 },
    ],
    volume: "$5,123,000",
  },
];

const cryptoMarkets = [
  {
    title: "Bitcoin above $100k by end of February?",
    options: [
      { name: "Yes", payout: "4.00x", odds: 24 },
      { name: "No", payout: "1.30x", odds: 76 },
    ],
    volume: "$12,450,000",
  },
  {
    title: "Ethereum ETF approval by Q2 2025?",
    options: [
      { name: "Yes", payout: "1.85x", odds: 52 },
      { name: "No", payout: "2.08x", odds: 48 },
    ],
    volume: "$8,900,000",
  },
];

export default function Index() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-6">
        <div className="grid lg:grid-cols-[1fr,320px] gap-8">
          {/* Main Content */}
          <div className="space-y-8">
            <FeaturedMarket />
            <MarketSection title="Pro Football" markets={proFootballMarkets} />
            <MarketSection title="Politics" markets={politicsMarkets} />
            <MarketSection title="Crypto" markets={cryptoMarkets} />
          </div>

          {/* Sidebar */}
          <div className="hidden lg:block">
            <TrendingSidebar />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-secondary/30 mt-12">
        <div className="container py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <span className="text-xl font-bold text-primary">Kastia</span>
              <span className="text-sm text-muted-foreground">
                © 2025 Kastia. All rights reserved.
              </span>
            </div>
            <nav className="flex items-center gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">Terms</a>
              <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
              <a href="#" className="hover:text-foreground transition-colors">Disclosures</a>
              <a href="#" className="hover:text-foreground transition-colors">Help</a>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}
