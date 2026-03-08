import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { DollarSign, Eye, BarChart3, TrendingUp, Copy, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

const stats = [
  { label: "Total Earnings", value: "$1,247.50", icon: DollarSign, change: "+12.4%" },
  { label: "Total Volume", value: "$83,200", icon: BarChart3, change: "+28.7%" },
  { label: "Embed Views", value: "45.2K", icon: Eye, change: "+8.1%" },
  { label: "Active Markets", value: "12", icon: TrendingUp, change: "+3" },
];

const markets = [
  {
    id: "1",
    question: "Bitcoin above $120k by June 2025?",
    status: "active" as const,
    volume: "$24,500",
    earnings: "$367.50",
    embedViews: 12400,
    yesOdds: 34,
    created: "2 days ago",
  },
  {
    id: "2",
    question: "Kenya opposition wins 2027 presidential election?",
    status: "active" as const,
    volume: "$18,200",
    earnings: "$273.00",
    embedViews: 8900,
    yesOdds: 42,
    created: "5 days ago",
  },
  {
    id: "3",
    question: "Will Messi play in the 2026 World Cup?",
    status: "active" as const,
    volume: "$31,800",
    earnings: "$477.00",
    embedViews: 18200,
    yesOdds: 71,
    created: "1 week ago",
  },
  {
    id: "4",
    question: "Ethereum flips Bitcoin market cap in 2025?",
    status: "resolved" as const,
    volume: "$8,700",
    earnings: "$130.50",
    embedViews: 5700,
    yesOdds: 8,
    created: "3 weeks ago",
  },
];

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Creator Dashboard</h1>
            <p className="text-muted-foreground text-sm mt-1">Track your markets, earnings, and embed performance.</p>
          </div>
          <Button variant="signup" size="pill" asChild>
            <a href="/create">+ New Market</a>
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-card rounded-xl border border-border p-5">
              <div className="flex items-center justify-between mb-3">
                <stat.icon className="w-5 h-5 text-primary" />
                <span className="text-xs font-medium text-success">{stat.change}</span>
              </div>
              <div className="text-2xl font-bold text-foreground">{stat.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Markets Table */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="font-semibold text-foreground">Your Markets</h2>
          </div>
          <div className="divide-y divide-border">
            {markets.map((market) => (
              <div key={market.id} className="px-6 py-4 hover:bg-secondary/50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`w-2 h-2 rounded-full ${market.status === "active" ? "bg-success" : "bg-muted-foreground"}`} />
                      <span className="font-medium text-foreground text-sm truncate">{market.question}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>Created {market.created}</span>
                      <span>Yes: {market.yesOdds}%</span>
                      <span>{market.embedViews.toLocaleString()} embed views</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 shrink-0">
                    <div className="text-right">
                      <div className="text-sm font-semibold text-foreground">{market.earnings}</div>
                      <div className="text-xs text-muted-foreground">earned</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-foreground">{market.volume}</div>
                      <div className="text-xs text-muted-foreground">volume</div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Copy className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
