import { Globe, Smartphone, Shield, TrendingUp } from "lucide-react";
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
    description: "Off-chain for speed. On-chain on Base (Ethereum L2) with USDC for transparency and composability.",
  },
  {
    icon: TrendingUp,
    title: "Contextual liquidity",
    description: "Markets inherit virality from host content. No cold-start — your audience IS the liquidity.",
  },
];

export function ValueProps() {
  return (
    <section className="py-24">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-xs font-semibold tracking-widest uppercase text-primary mb-4 block">
            Why Kastia
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
            Built for creators, not traders
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Prediction infrastructure embedded into the fabric of online conversation.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {props.map((prop, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="group relative bg-card rounded-2xl border border-border p-8 hover:border-primary/20 hover:shadow-xl transition-all duration-300"
            >
              <div className="absolute top-0 left-8 w-12 h-[2px] bg-primary/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
              <prop.icon className="w-8 h-8 text-primary mb-5" />
              <h3 className="font-semibold text-lg text-foreground mb-2">{prop.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{prop.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
