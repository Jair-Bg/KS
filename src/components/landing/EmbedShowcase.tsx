import { EmbedWidget } from "@/components/EmbedWidget";

export function EmbedShowcase() {
  return (
    <section className="py-16 bg-secondary/30">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Live anywhere your audience is
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Interactive prediction widgets that work inside any content — blogs, social posts, newsletters, and chats.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Blog mock */}
          <div className="bg-card rounded-xl border border-border p-6 space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-full bg-muted" />
              <div>
                <div className="text-sm font-medium text-foreground">@cryptoanalyst</div>
                <div className="text-xs text-muted-foreground">Posted 2h ago</div>
              </div>
            </div>
            <p className="text-sm text-foreground leading-relaxed">
              Bitcoin's been consolidating for weeks. The ETF flows are telling a story most people aren't reading. Here's my take on what happens next 👇
            </p>
            <EmbedWidget
              marketId="abc123"
              question="Bitcoin above $120k by June 2025?"
              yesOdds={34}
              noOdds={66}
              volume="$2.4M"
              compact
            />
            <p className="text-sm text-muted-foreground">What do you think? Put your prediction where your mouth is 👆</p>
          </div>

          {/* YouTube description mock */}
          <div className="bg-card rounded-xl border border-border p-6 space-y-4">
            <div className="w-full aspect-video bg-muted rounded-lg flex items-center justify-center">
              <span className="text-4xl">▶️</span>
            </div>
            <div className="text-sm font-semibold text-foreground">Will Kenya's Gen-Z movement reshape 2027 elections?</div>
            <div className="text-xs text-muted-foreground">234K views · 1 day ago</div>
            <EmbedWidget
              question="Kenya opposition wins 2027 presidential election?"
              yesOdds={42}
              noOdds={58}
              volume="$180K"
              compact
            />
          </div>
        </div>
      </div>
    </section>
  );
}
