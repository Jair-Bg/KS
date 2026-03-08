import { MessageSquarePlus, Code2, Users, DollarSign } from "lucide-react";
import { motion } from "framer-motion";

const steps = [
  {
    icon: MessageSquarePlus,
    title: "Create a market",
    description: "Paste a URL or type a question. AI refines it into a tradeable prediction market in seconds.",
  },
  {
    icon: Code2,
    title: "Grab the embed",
    description: "Copy a tiny snippet — works as an iframe, JS widget, or rich-link preview for any platform.",
  },
  {
    icon: Users,
    title: "Your audience trades",
    description: "Viewers see live probabilities and trade directly inside the content they're already consuming.",
  },
  {
    icon: DollarSign,
    title: "You earn",
    description: "Receive 5–15% of trading volume from markets you launch. Passive income from your influence.",
  },
];

export function HowItWorks() {
  return (
    <section className="py-24 bg-secondary/30 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[1px] bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      </div>

      <div className="container relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-xs font-semibold tracking-widest uppercase text-primary mb-4 block">
            How It Works
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
            Live in under 60 seconds
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            From question to live prediction market — no code required.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="relative group"
            >
              <div className="bg-card rounded-2xl border border-border p-6 h-full hover:border-primary/20 hover:shadow-xl transition-all duration-300">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <step.icon className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-xs font-bold text-muted-foreground/50">0{i + 1}</span>
                </div>
                <h3 className="font-semibold text-foreground mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
