import { EmbedWidget } from "@/components/EmbedWidget";
import { motion } from "framer-motion";

export function EmbedShowcase() {
  return (
    <section className="py-24 relative">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-xs font-semibold tracking-widest uppercase text-primary mb-4 block">
            Embed Anywhere
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
            Markets that live in your content
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Interactive prediction widgets that work inside blogs, social posts, newsletters, and group chats.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Blog/X post mock */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-card rounded-2xl border border-border p-6 space-y-4 hover:border-primary/20 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center text-sm font-bold text-primary">CA</div>
              <div>
                <div className="text-sm font-semibold text-foreground">@cryptoanalyst</div>
                <div className="text-xs text-muted-foreground">2h ago · X</div>
              </div>
            </div>
            <p className="text-sm text-foreground leading-relaxed">
              Bitcoin's been consolidating for weeks. The ETF flows are telling a story most people aren't reading. Here's my take 👇
            </p>
            <EmbedWidget
              marketId="abc123"
              question="Bitcoin above $120k by June 2025?"
              yesOdds={34}
              noOdds={66}
              volume="$2.4M"
              compact
            />
            <p className="text-sm text-muted-foreground">Put your prediction where your mouth is 👆</p>
          </motion.div>

          {/* YouTube mock */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-card rounded-2xl border border-border p-6 space-y-4 hover:border-primary/20 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500"
          >
            <div className="w-full aspect-video bg-gradient-to-br from-muted to-muted/50 rounded-xl flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,hsl(var(--primary)/0.1),transparent_70%)]" />
              <div className="w-16 h-16 rounded-full bg-foreground/80 flex items-center justify-center backdrop-blur-sm">
                <span className="text-background text-2xl ml-1">▶</span>
              </div>
            </div>
            <div className="text-sm font-semibold text-foreground">Will Kenya's Gen-Z movement reshape 2027 elections?</div>
            <div className="text-xs text-muted-foreground">234K views · 1 day ago</div>
            <EmbedWidget
              marketId="def456"
              question="Kenya opposition wins 2027 presidential election?"
              yesOdds={42}
              noOdds={58}
              volume="$180K"
              compact
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
