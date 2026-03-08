import { Globe, Smartphone, Shield, TrendingUp } from "lucide-react";

const props = [
  {
    icon: Globe,
    title: "Universal embeds",
    description: "Works in YouTube descriptions, X threads, Substack, Discord, Telegram, WhatsApp rich previews, newsletters, and Twitch overlays.",
  },
  {
    icon: Smartphone,
    title: "Mobile-first",
    description: "Designed for mobile-heavy audiences. Lightweight widgets load fast even on 3G connections across Africa and emerging markets.",
  },
  {
    icon: Shield,
    title: "Hybrid settlement",
    description: "Off-chain for speed and low friction. On-chain settlement on Base (Ethereum L2) with USDC for transparency and composability.",
  },
  {
    icon: TrendingUp,
    title: "Contextual liquidity",
    description: "Markets inherit virality from their host content. No cold-start problem — your audience IS the liquidity.",
  },
];

export function ValueProps() {
  return (
    <section className="py-20 bg-secondary/30">
      <div className="container">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Built for creators, not traders
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Kastia is prediction infrastructure embedded into the fabric of online conversation.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {props.map((prop, i) => (
            <div key={i} className="bg-card rounded-xl border border-border p-6 hover:border-primary/20 hover:shadow-lg transition-all">
              <prop.icon className="w-8 h-8 text-primary mb-4" />
              <h3 className="font-semibold text-foreground mb-2">{prop.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{prop.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
