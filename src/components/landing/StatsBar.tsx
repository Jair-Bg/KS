import { motion } from "framer-motion";

const stats = [
  { value: "$12M+", label: "Volume Traded" },
  { value: "4,200+", label: "Markets Created" },
  { value: "18K+", label: "Active Traders" },
  { value: "92%", label: "Accuracy Rate" },
];

export function StatsBar() {
  return (
    <section className="py-16 border-y border-border">
      <div className="container">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="text-center"
            >
              <div className="text-3xl md:text-4xl font-extrabold text-foreground mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
