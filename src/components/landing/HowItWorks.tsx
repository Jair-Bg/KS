import { MessageSquarePlus, Code2, Users, DollarSign } from "lucide-react";
import { motion } from "framer-motion";

const steps = [
  {
    icon: MessageSquarePlus,
    title: "Create a market",
    description: "Paste a URL or type a question. AI refines it into a tradeable prediction market in seconds.",
    accent: "from-primary/20 to-primary/5",
  },
  {
    icon: Code2,
    title: "Grab the embed",
    description: "Copy a tiny snippet — works as an iframe, JS widget, or rich-link preview for any platform.",
    accent: "from-primary/15 to-primary/5",
  },
  {
    icon: Users,
    title: "Your audience trades",
    description: "Viewers see live probabilities and trade directly inside the content they're already consuming.",
    accent: "from-primary/20 to-primary/5",
  },
  {
    icon: DollarSign,
    title: "You earn",
    description: "Receive 5–15% of trading volume from markets you launch. Passive income from your influence.",
    accent: "from-primary/15 to-primary/5",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-28 relative overflow-hidden">
      {/* Subtle background */}
      <div className="absolute inset-0 bg-gradient-to-b from-secondary/30 via-secondary/50 to-secondary/30 pointer-events-none" />

      <div className="container relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20 space-y-5"
        >
          <span className="section-label">How It Works</span>
          <h2 className="section-heading">
            Live in under <span className="gradient-text">60 seconds</span>
          </h2>
          <p className="section-subheading mx-auto">
            From question to live prediction market — no code, no cold start.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="group relative"
            >
              <div className="premium-card p-7 h-full relative overflow-hidden">
                {/* Hover gradient */}
                <div className={`absolute inset-0 bg-gradient-to-br ${step.accent} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
                      <step.icon className="w-5 h-5 text-primary" />
                    </div>
                    <span className="text-xs font-bold text-muted-foreground tracking-widest">
                      STEP 0{i + 1}
                    </span>
                  </div>
                  <h3 className="font-semibold text-foreground mb-2.5 text-lg">{step.title}</h3>
                  <p className="text-base md:text-sm text-muted-foreground leading-relaxed">{step.description}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
