import { EmbedWidget } from "@/components/EmbedWidget";
import { motion } from "framer-motion";

export function EmbedShowcase() {
  return (
    <section className="py-28 relative overflow-hidden">
      {/* Background accent */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full opacity-20 pointer-events-none"
        style={{ background: "radial-gradient(circle, hsl(var(--primary) / 0.15), transparent 70%)" }}
      />

      <div className="container relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20 space-y-5"
        >
          <span className="section-label">Embed Anywhere</span>
          <h2 className="section-heading">
            Markets that live in
            <br className="hidden sm:block" />
            <span className="gradient-text"> your content</span>
          </h2>
          <p className="section-subheading mx-auto">
            Interactive prediction widgets that work inside blogs, social posts, newsletters, and group chats.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* X/Twitter mock */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="premium-card p-6 md:p-8 space-y-5"
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary/40 to-primary/10 flex items-center justify-center text-sm font-bold text-primary ring-2 ring-primary/10">
                CA
              </div>
              <div>
                <div className="text-sm font-semibold text-foreground">@cryptoanalyst</div>
                <div className="text-xs text-muted-foreground">2h ago · X</div>
              </div>
            </div>
            <p className="text-sm text-foreground/80 leading-relaxed">
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
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="premium-card p-6 md:p-8 space-y-5"
          >
            <div className="w-full aspect-video rounded-xl overflow-hidden relative bg-gradient-to-br from-muted to-muted/30">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-foreground/10 backdrop-blur-sm flex items-center justify-center ring-1 ring-foreground/10 hover:scale-110 transition-transform cursor-pointer">
                  <span className="text-foreground text-xl ml-0.5">▶</span>
                </div>
              </div>
              <div className="absolute bottom-3 left-3 right-3 flex justify-between items-center">
                <div className="h-1 flex-1 rounded-full bg-foreground/10 overflow-hidden">
                  <div className="h-full w-1/3 rounded-full bg-primary/60" />
                </div>
                <span className="text-xs text-foreground/50 ml-3 font-mono">12:34</span>
              </div>
            </div>
            <div>
              <div className="text-sm font-semibold text-foreground">Will Kenya's Gen-Z movement reshape 2027 elections?</div>
              <div className="text-xs text-muted-foreground mt-1">234K views · 1 day ago</div>
            </div>
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
