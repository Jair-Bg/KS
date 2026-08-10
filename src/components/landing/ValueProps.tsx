import { Globe, Smartphone, Shield, TrendingUp, Zap, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";

const props = [
  {
    icon: Globe,
    title: "Universal embeds",
    description: "YouTube, X, Substack, Discord, Telegram, WhatsApp, newsletters, Twitch overlays — works everywhere.",
  },
  {
    icon: Smartphone,
    title: "Mobile-first",
    description: "Lightweight widgets load fast on 3G. Designed for mobile-heavy audiences across emerging markets.",
  },
  {
    icon: Shield,
    title: "Hybrid settlement",
    description: "Off-chain for speed. On-chain on Base (L2) with USDC for transparency and composability.",
  },
  {
    icon: TrendingUp,
    title: "Contextual liquidity",
    description: "Markets inherit virality from host content. No cold-start — your audience IS the liquidity.",
  },
  {
    icon: Zap,
    title: "AI-powered creation",
    description: "AI refines your question, suggests parameters, and auto-resolves markets from trusted data sources.",
  },
  {
    icon: BarChart3,
    title: "Creator analytics",
    description: "Real-time dashboard with volume, earnings, and engagement metrics for every market you create.",
  },
];

export function ValueProps() {
  return (
    <section id="features" className="py-28 relative">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20 space-y-5"
        >
          <span className="section-label">Why Kastia</span>
          <h2 className="section-heading">
            Built for <span className="gradient-text">creators</span>, not traders
          </h2>
          <p className="section-subheading mx-auto">
            Prediction infrastructure embedded into the fabric of online conversation.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {props.map((prop, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.06 }}
              className="group"
            >
              <div className="premium-card p-7 h-full relative overflow-hidden">
                {/* Top accent line */}
                <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/15 group-hover:scale-110 transition-all duration-300">
                  <prop.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold text-lg text-foreground mb-2">{prop.title}</h3>
                <p className="text-base md:text-sm text-muted-foreground leading-relaxed">{prop.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
