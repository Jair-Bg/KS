import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export function CreatorCTA() {
  return (
    <section className="py-24">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative max-w-4xl mx-auto text-center rounded-3xl border border-primary/20 p-14 md:p-20 overflow-hidden"
        >
          {/* Background glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-primary/8 blur-[100px] pointer-events-none" />

          <div className="relative z-10">
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-5">
              Ready to monetize your influence?
            </h2>
            <p className="text-muted-foreground text-lg mb-10 max-w-lg mx-auto">
              Join creators turning speculation into revenue. Create your first market in under a minute.
            </p>
            <Link to="/auth">
              <Button variant="signup" size="lg" className="text-base px-12 h-14 rounded-full text-lg font-semibold shadow-lg shadow-primary/25">
                Start Creating Markets
                <ArrowRight className="w-5 h-5 ml-1" />
              </Button>
            </Link>
            <p className="text-xs text-muted-foreground mt-6">
              Free to start · No credit card · Earn from day one
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
