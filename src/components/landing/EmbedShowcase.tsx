import { EmbedWidget } from "@/components/EmbedWidget";
import { motion } from "framer-motion";
import { useEffect, useRef } from "react";

export function EmbedShowcase() {
  const tweetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load Twitter widget script
    const script = document.createElement("script");
    script.src = "https://platform.twitter.com/widgets.js";
    script.async = true;
    script.charset = "utf-8";
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <section className="py-28 relative overflow-hidden">
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
          {/* Real Tweet Embed */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="premium-card p-6 md:p-8 space-y-5"
          >
            <div ref={tweetRef} className="rounded-xl overflow-hidden [&_iframe]:!rounded-xl">
              <blockquote className="twitter-tweet" data-theme="dark" data-conversation="none">
                <p lang="en" dir="ltr">The Cursor for Hardware is finally here! who wants to test? <a href="https://t.co/dCOcvEjGhT">pic.twitter.com/dCOcvEjGhT</a></p>&mdash; sam (@SamuelBeek) <a href="https://twitter.com/SamuelBeek/status/2020889997646188625">February 9, 2026</a>
              </blockquote>
            </div>
            <EmbedWidget
              marketId="abc123"
              question="'Cursor for Hardware' startup raises $50M+ by end of 2026?"
              yesOdds={41}
              noOdds={59}
              volume="$320K"
              compact
            />
            <p className="text-sm text-muted-foreground">Put your prediction where your mouth is 👆</p>
          </motion.div>

          {/* Real YouTube Embed */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="premium-card p-6 md:p-8 space-y-5"
          >
            <div className="w-full aspect-video rounded-xl overflow-hidden">
              <iframe
                className="w-full h-full"
                src="https://www.youtube.com/embed/GkX-H4dZxYI"
                title="Kenya Gen-Z movement"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
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
