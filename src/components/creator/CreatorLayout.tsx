import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { BarChart3, PlusCircle, Code2, ArrowLeft, LogOut, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";

const creatorNav = [
  { to: "/creator-dashboard", label: "Overview", icon: BarChart3 },
  { to: "/create", label: "New Market", icon: PlusCircle },
  { to: "/embeds", label: "Embed Toolkit", icon: Code2 },
];

interface CreatorLayoutProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Dedicated shell for the creator workspace. Deliberately separate from the
 * trader `Header` (no market search, no category pills) so the creator area
 * is its own product surface, only reachable once signed in as a creator.
 */
export function CreatorLayout({ title, description, actions, children }: CreatorLayoutProps) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Creator";

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `inline-flex items-center gap-2 min-h-11 px-3 rounded-lg text-sm font-medium transition-colors ${
      isActive ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
    }`;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-50 bg-background border-b border-border">
        <div className="container py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-6 min-w-0">
              <Link to="/creator-dashboard" className="flex items-baseline gap-2 shrink-0">
                <span className="text-xl font-bold text-primary">Kastia</span>
                <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground border border-border rounded px-1.5 py-0.5">
                  Creator
                </span>
              </Link>
              <nav className="hidden md:flex items-center gap-1">
                {creatorNav.map((item) => (
                  <NavLink key={item.to} to={item.to} className={linkClass} end>
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </NavLink>
                ))}
              </nav>
            </div>

            <div className="flex items-center gap-2">
              <Link to="/markets" className="hidden sm:inline-flex">
                <Button variant="ghost" size="sm" className="min-h-11 gap-1.5">
                  <ArrowLeft className="w-4 h-4" />
                  Trading app
                </Button>
              </Link>
              <ThemeToggle />
              <div className="hidden md:flex items-center gap-2 pl-2 border-l border-border">
                <span className="text-sm text-muted-foreground max-w-[140px] truncate">{displayName}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Sign out"
                  className="min-h-11 min-w-11"
                  onClick={async () => {
                    await signOut();
                    navigate("/");
                  }}
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
              <button
                className="md:hidden inline-flex items-center justify-center min-h-11 min-w-11 rounded-lg text-foreground hover:bg-secondary"
                aria-label={mobileOpen ? "Close menu" : "Open menu"}
                aria-expanded={mobileOpen}
                onClick={() => setMobileOpen((v) => !v)}
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {mobileOpen && (
            <nav className="md:hidden flex flex-col gap-1 pt-3">
              {creatorNav.map((item) => (
                <NavLink key={item.to} to={item.to} className={linkClass} onClick={() => setMobileOpen(false)} end>
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </NavLink>
              ))}
              <Link to="/markets" className={linkClass({ isActive: false })} onClick={() => setMobileOpen(false)}>
                <ArrowLeft className="w-4 h-4" />
                Trading app
              </Link>
              <button
                className={`${linkClass({ isActive: false })} text-destructive`}
                onClick={async () => {
                  await signOut();
                  navigate("/");
                }}
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </button>
            </nav>
          )}
        </div>
      </header>

      <main className="container py-8 flex-1">
        <div className="flex items-start justify-between gap-4 flex-wrap mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{title}</h1>
            {description && <p className="text-muted-foreground text-sm mt-1">{description}</p>}
          </div>
          {actions && <div className="flex gap-2 flex-wrap">{actions}</div>}
        </div>
        {children}
      </main>

      <footer className="border-t border-border">
        <div className="container py-6 flex items-center justify-between gap-4 flex-wrap text-sm text-muted-foreground">
          <span>Kastia Creator workspace</span>
          <Link to="/markets" className="hover:text-foreground transition-colors">
            Back to trading
          </Link>
        </div>
      </footer>
    </div>
  );
}
