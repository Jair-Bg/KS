import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ConnectWalletButton } from "@/components/ConnectWalletButton";
import { ArrowRight, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const navLinks = [
  { href: "/markets", label: "Markets" },
  { href: "/creators", label: "Creators" },
  { href: "#how-it-works", label: "How It Works" },
  { href: "#features", label: "Features" },
];

export function LandingHeader() {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNav = (href: string) => {
    setMobileOpen(false);
    if (href.startsWith("#")) {
      document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
    } else {
      navigate(href);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <div className="glass-card border-0 border-b border-border/40 rounded-none">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <a
              href="/"
              onClick={(e) => { e.preventDefault(); navigate("/"); }}
              className="text-2xl font-bold text-foreground tracking-tight"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              <span className="gradient-text">Kastia</span>
            </a>

            <nav className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <button
                  key={link.href}
                  onClick={() => handleNav(link.href)}
                  className="inline-flex items-center min-h-11 px-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-200"
                >
                  {link.label}
                </button>
              ))}
            </nav>

            <div className="flex items-center gap-3">
              <ThemeToggle />
              <div className="hidden md:block">
                <ConnectWalletButton />
              </div>
              <Button
                variant="ghost"
                className="hidden md:inline-flex text-sm"
                onClick={() => navigate("/auth")}
              >
                Log in
              </Button>
              <Button
                variant="signup"
                size="sm"
                className="hidden md:inline-flex text-sm px-5 h-9 rounded-full font-semibold shadow-md shadow-primary/20"
                onClick={() => navigate("/auth")}
              >
                Get Started
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
              <button
                className="md:hidden inline-flex items-center justify-center min-h-11 min-w-11 rounded-lg text-foreground hover:bg-secondary transition-colors"
                aria-label={mobileOpen ? "Close menu" : "Open menu"}
                aria-expanded={mobileOpen}
                onClick={() => setMobileOpen(!mobileOpen)}
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="md:hidden glass-card border-0 border-b border-border/40 rounded-none"
          >
            <div className="container py-4 flex flex-col gap-3">
              {navLinks.map((link) => (
                <button
                  key={link.href}
                  onClick={() => handleNav(link.href)}
                  className="text-left min-h-11 flex items-center text-base font-medium text-muted-foreground hover:text-foreground py-2"
                >
                  {link.label}
                </button>
              ))}
              <div className="flex gap-2 pt-2">
                <Button variant="ghost" size="sm" className="min-h-11 text-base" onClick={() => { setMobileOpen(false); navigate("/auth"); }}>
                  Log in
                </Button>
                <Button variant="signup" size="sm" className="rounded-full min-h-11 text-base" onClick={() => { setMobileOpen(false); navigate("/auth"); }}>
                  Get Started
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
