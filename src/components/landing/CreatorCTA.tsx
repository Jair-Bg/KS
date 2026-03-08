import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export function CreatorCTA() {
  return (
    <section className="py-20">
      <div className="container">
        <div className="max-w-3xl mx-auto text-center bg-gradient-to-br from-primary/10 via-primary/5 to-transparent rounded-3xl border border-primary/20 p-12 md:p-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Ready to monetize your influence?
          </h2>
          <p className="text-muted-foreground text-lg mb-8 max-w-lg mx-auto">
            Join thousands of creators turning speculation into revenue. Create your first market in under a minute.
          </p>
          <Link to="/create">
            <Button variant="signup" size="lg" className="text-base px-10 h-12 rounded-full">
              Start Creating Markets
              <ArrowRight className="w-5 h-5 ml-1" />
            </Button>
          </Link>
          <p className="text-xs text-muted-foreground mt-4">
            Free to start · No credit card required · Earn from day one
          </p>
        </div>
      </div>
    </section>
  );
}
