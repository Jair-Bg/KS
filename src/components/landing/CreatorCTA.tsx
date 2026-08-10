import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export function CreatorCTA() {
  return (
    <section className="py-28">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative max-w-4xl mx-auto text-center rounded-3xl overflow-hidden"
        >
          {/* Card with layered backgrounds */}
          <div className="relative p-14 md:p-20">
            {/* Multi-layer background */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-card to-primary/5 dark:from-card dark:via-card dark:to-card border border-primary/15 dark:border-border rounded-3xl" />
            <div className="absolute inset-0 rounded-3xl dark:hidden"
              style={{ background: "radial-gradient(ellipse at 50% 0%, hsl(var(--primary) / 0.12), transparent 60%)" }}
            />
            {/* Dot pattern inside CTA */}
            <div className="absolute inset-0 rounded-3xl opacity-[0.03]"
              style={{
                backgroundImage: "radial-gradient(circle, hsl(var(--foreground)) 1px, transparent 1px)",
                backgroundSize: "24px 24px",
              }}
            />

            <div className="relative z-10 space-y-6">
              <h2 className="text-3xl md:text-5xl font-bold text-foreground leading-tight text-balance">
                Ready to monetize
                <br />
                <span className="gradient-text">your influence?</span>
              </h2>
              <p className="text-muted-foreground text-lg max-w-lg mx-auto">
                Join creators turning speculation into revenue. Create your first market in under a minute.
              </p>
              <div className="pt-2">
                <Link to="/auth/creator">
                  <Button
                    variant="signup"
                    size="lg"
                    className="text-base px-12 h-14 rounded-full text-lg font-semibold shadow-xl shadow-primary/25 hover:shadow-2xl hover:shadow-primary/35 hover:scale-[1.02] transition-all duration-300"
                  >
                    Start Creating Markets
                    <ArrowRight className="w-5 h-5 ml-1" />
                  </Button>
                </Link>
              </div>
              <p className="text-sm text-muted-foreground pt-2">
                Free to start · No credit card · Earn from day one
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
