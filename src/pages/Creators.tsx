import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { TrendingUp, Users, DollarSign, Star, ExternalLink, BarChart3, ArrowRight, Code2, Tv } from "lucide-react";
import { EmbedWidget } from "@/components/EmbedWidget";

const featuredCreators = [
  {
    name: "Amina Osei",
    handle: "@aminaosei",
    avatar: "AO",
    bio: "Kenyan politics & East African affairs analyst. 200K+ followers on X.",
    totalVolume: "$142,000",
    marketsCreated: 34,
    embedViews: "89K",
    earnings: "$8,520",
    topMarket: "Kenya opposition wins 2027?",
    badge: "Top Creator",
  },
  {
    name: "Marcus Chen",
    handle: "@marcuscrypto",
    avatar: "MC",
    bio: "Crypto analyst & YouTuber. Breaking down market movements daily.",
    totalVolume: "$98,500",
    marketsCreated: 22,
    embedViews: "62K",
    earnings: "$5,910",
    topMarket: "Bitcoin above $120k by June?",
    badge: "Rising Star",
  },
  {
    name: "Fatima Al-Hassan",
    handle: "@fatimapredicts",
    avatar: "FA",
    bio: "Sports prediction queen. Covering football, NBA, and esports.",
    totalVolume: "$76,200",
    marketsCreated: 41,
    embedViews: "51K",
    earnings: "$4,572",
    topMarket: "Messi plays 2026 World Cup?",
    badge: "Most Active",
  },
  {
    name: "Daniel Kimani",
    handle: "@dkimani_ke",
    avatar: "DK",
    bio: "Nairobi-based tech blogger. Covering African startups & fintech.",
    totalVolume: "$54,800",
    marketsCreated: 18,
    embedViews: "34K",
    earnings: "$3,288",
    topMarket: "Safaricom launches crypto wallet in 2025?",
    badge: "",
  },
  {
    name: "Priya Sharma",
    handle: "@priyafinance",
    avatar: "PS",
    bio: "Newsletter writer covering global macro & emerging market trends.",
    totalVolume: "$45,100",
    marketsCreated: 15,
    embedViews: "28K",
    earnings: "$2,706",
    topMarket: "Fed cuts rates before July?",
    badge: "",
  },
  {
    name: "Kofi Mensah",
    handle: "@kofimensah",
    avatar: "KM",
    bio: "Ghanaian culture & entertainment commentator. Afrobeats predictions.",
    totalVolume: "$38,600",
    marketsCreated: 27,
    embedViews: "45K",
    earnings: "$2,316",
    topMarket: "Burna Boy wins Grammy 2025?",
    badge: "",
  },
];

const leaderboard = [
  { rank: 1, name: "Amina Osei", earnings: "$8,520", volume: "$142K", markets: 34 },
  { rank: 2, name: "Marcus Chen", earnings: "$5,910", volume: "$98.5K", markets: 22 },
  { rank: 3, name: "Fatima Al-Hassan", earnings: "$4,572", volume: "$76.2K", markets: 41 },
  { rank: 4, name: "Daniel Kimani", earnings: "$3,288", volume: "$54.8K", markets: 18 },
  { rank: 5, name: "Priya Sharma", earnings: "$2,706", volume: "$45.1K", markets: 15 },
  { rank: 6, name: "Kofi Mensah", earnings: "$2,316", volume: "$38.6K", markets: 27 },
  { rank: 7, name: "Jane Wanjiku", earnings: "$1,980", volume: "$33K", markets: 12 },
  { rank: 8, name: "Tom Odhiambo", earnings: "$1,740", volume: "$29K", markets: 19 },
  { rank: 9, name: "Zara Otieno", earnings: "$1,520", volume: "$25.3K", markets: 9 },
  { rank: 10, name: "Brian Mwangi", earnings: "$1,290", volume: "$21.5K", markets: 14 },
];

const perks = [
  {
    icon: DollarSign,
    title: "Earn 5–15% of Volume",
    description: "Every trade on a market you create puts money in your pocket. The more your embed gets shared, the more you earn.",
  },
  {
    icon: BarChart3,
    title: "Real-Time Analytics",
    description: "Track embed views, trading volume, and earnings across all your markets from one dashboard.",
  },
  {
    icon: Users,
    title: "Grow Your Audience",
    description: "Interactive prediction widgets boost engagement. Readers spend 3x longer on content with embedded markets.",
  },
  {
    icon: Star,
    title: "Creator Leaderboard",
    description: "Top creators get featured on our homepage, earning visibility and organic traffic to their content.",
  },
];

export default function Creators() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        {/* Hero */}
        <section className="py-16 md:py-24 bg-gradient-to-b from-primary/5 to-background">
          <div className="container text-center">
            <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              Creator Program
            </span>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 tracking-tight">
              Turn Your Audience Into a
              <span className="gradient-text block">Prediction Engine</span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-8">
              Create prediction markets on any topic. Embed them in your content.
              Earn a cut of every trade your audience makes — all without leaving your platform.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Button variant="signup" size="lg" className="rounded-full px-8" asChild>
                <a href="/create">Start Creating Markets</a>
              </Button>
              <Button variant="outline" size="lg" className="rounded-full px-8">
                Learn More
              </Button>
            </div>
            <div className="flex items-center justify-center gap-8 mt-10 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-primary" />
                <span>$30K+ paid to creators</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                <span>150+ active creators</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                <span>500K+ embed views</span>
              </div>
            </div>
          </div>
        </section>

        {/* How Creator Earning Works */}
        <section className="py-16 border-t border-border">
          <div className="container">
            <h2 className="text-2xl font-bold text-foreground text-center mb-12">
              Why Creators Love Kastia
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {perks.map((perk) => (
                <div key={perk.title} className="bg-card border border-border rounded-xl p-6 hover:border-primary/20 transition-colors">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <perk.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{perk.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{perk.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Creators */}
        <section className="py-16 bg-secondary/30">
          <div className="container">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-foreground">Featured Creators</h2>
              <span className="text-sm text-muted-foreground">Top performers this month</span>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredCreators.map((creator) => (
                <div
                  key={creator.handle}
                  className="bg-card border border-border rounded-xl p-5 hover:border-primary/20 hover:shadow-lg transition-all group"
                >
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                      {creator.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-foreground truncate">{creator.name}</h3>
                        {creator.badge && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary whitespace-nowrap">
                            {creator.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{creator.handle}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{creator.bio}</p>
                  <div className="bg-secondary/60 rounded-lg p-3 mb-3">
                    <p className="text-xs text-muted-foreground mb-1">Top market:</p>
                    <p className="text-sm font-medium text-foreground">{creator.topMarket}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div>
                      <div className="text-sm font-bold text-foreground">{creator.earnings}</div>
                      <div className="text-[10px] text-muted-foreground">Earned</div>
                    </div>
                    <div>
                      <div className="text-sm font-bold text-foreground">{creator.totalVolume}</div>
                      <div className="text-[10px] text-muted-foreground">Volume</div>
                    </div>
                    <div>
                      <div className="text-sm font-bold text-foreground">{creator.embedViews}</div>
                      <div className="text-[10px] text-muted-foreground">Embed Views</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Leaderboard */}
        <section className="py-16">
          <div className="container max-w-3xl">
            <h2 className="text-2xl font-bold text-foreground text-center mb-8">
              Creator Leaderboard
            </h2>
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="grid grid-cols-[48px,1fr,100px,100px,80px] px-5 py-3 text-xs font-medium text-muted-foreground border-b border-border bg-secondary/30">
                <span>#</span>
                <span>Creator</span>
                <span className="text-right">Earnings</span>
                <span className="text-right">Volume</span>
                <span className="text-right">Markets</span>
              </div>
              {leaderboard.map((row) => (
                <div
                  key={row.rank}
                  className="grid grid-cols-[48px,1fr,100px,100px,80px] px-5 py-3.5 items-center border-b border-border last:border-b-0 hover:bg-secondary/30 transition-colors"
                >
                  <span className={`text-sm font-bold ${row.rank <= 3 ? "text-primary" : "text-muted-foreground"}`}>
                    {row.rank}
                  </span>
                  <span className="text-sm font-medium text-foreground">{row.name}</span>
                  <span className="text-sm font-semibold text-foreground text-right">{row.earnings}</span>
                  <span className="text-sm text-muted-foreground text-right">{row.volume}</span>
                  <span className="text-sm text-muted-foreground text-right">{row.markets}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Embed Everywhere Section */}
        <section className="py-16 border-t border-border">
          <div className="container">
            <div className="text-center mb-10">
              <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-3">
                <Code2 className="w-3.5 h-3.5 inline mr-1" /> Embed Toolkit
              </span>
              <h2 className="text-3xl font-bold text-foreground mb-3">
                Works Everywhere Your Audience Is
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Drop prediction widgets into YouTube live streams, Twitch overlays, blogs, newsletters, or Discord. Your audience bets without switching tabs.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-8">
              {/* Live stream mock */}
              <div className="bg-card rounded-xl border border-border overflow-hidden">
                <div className="bg-secondary/60 px-4 py-2 flex items-center gap-2 border-b border-border">
                  <Tv className="w-3.5 h-3.5 text-destructive" />
                  <span className="text-xs font-medium text-foreground">Live Stream</span>
                  <span className="text-[10px] bg-destructive text-destructive-foreground px-1.5 py-0.5 rounded ml-auto font-medium">● LIVE</span>
                </div>
                <div className="p-4 space-y-3">
                  <div className="w-full aspect-video bg-muted rounded-lg flex items-center justify-center">
                    <span className="text-3xl">▶️</span>
                  </div>
                  <EmbedWidget
                    marketId="live001"
                    question="Streamer reaches 10K viewers this session?"
                    yesOdds={55}
                    noOdds={45}
                    volume="$12K"
                    compact
                  />
                </div>
              </div>

              {/* Blog mock */}
              <div className="bg-card rounded-xl border border-border p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-muted" />
                  <div>
                    <div className="text-sm font-medium text-foreground">@cryptoanalyst</div>
                    <div className="text-xs text-muted-foreground">Newsletter · 2h ago</div>
                  </div>
                </div>
                <p className="text-sm text-foreground leading-relaxed">
                  Bitcoin's consolidating hard. ETF flows are telling a story. Here's my prediction 👇
                </p>
                <EmbedWidget
                  marketId="abc123"
                  question="Bitcoin above $120k by June 2025?"
                  yesOdds={34}
                  noOdds={66}
                  volume="$2.4M"
                  compact
                />
              </div>
            </div>

            <div className="text-center">
              <Button variant="signup" size="lg" className="rounded-full px-8" asChild>
                <a href="/embeds">
                  Open Embed Toolkit <ArrowRight className="w-4 h-4 ml-2" />
                </a>
              </Button>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 bg-primary/5 border-t border-border">
          <div className="container text-center">
            <h2 className="text-3xl font-bold text-foreground mb-4">Ready to Monetize Your Influence?</h2>
            <p className="text-muted-foreground max-w-xl mx-auto mb-8">
              Join 150+ creators already earning from their predictions. Create your first market in under 60 seconds.
            </p>
            <Button variant="signup" size="lg" className="rounded-full px-8" asChild>
              <a href="/create">
                Create Your First Market <ArrowRight className="w-4 h-4 ml-2" />
              </a>
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
