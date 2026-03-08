import { motion } from "framer-motion";

const stats = [
  { value: "$12M+", label: "Volume Traded", suffix: "" },
  { value: "4,200+", label: "Markets Created", suffix: "" },
  { value: "18K+", label: "Active Traders", suffix: "" },
  { value: "92%", label: "Accuracy Rate", suffix: "" },
];

export function StatsBar() {
  return (
    <section className="py-20 relative">
      <div className="container">
        <div className="premium-card p-8 md:p-12 max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
            {stats.map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="text-center relative"
              >
                {i > 0 && (
                  <div className="hidden md:block absolute left-0 top-1/2 -translate-y-1/2 w-px h-10 bg-border" />
                )}
                <div className="text-3xl md:text-4xl font-bold gradient-text mb-1.5">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
