import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { ChevronDown, LogOut, History, User, Settings } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export function WalletButton() {
  const { user, loading, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  if (loading) {
    return <div className="w-24 h-9 rounded-full bg-secondary animate-pulse" />;
  }

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/auth")}
          className="text-sm"
        >
          Sign In
        </Button>
        <Button
          variant="signup"
          size="pill"
          onClick={() => navigate("/auth")}
        >
          Sign Up
        </Button>
      </div>
    );
  }

  const displayName = user.user_metadata?.full_name || user.email?.split("@")[0] || "User";
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <div className="relative">
      <Button
        variant="odds"
        size="pill"
        onClick={() => setMenuOpen(!menuOpen)}
        className="gap-2"
      >
        <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
          {initials}
        </span>
        <span className="text-sm max-w-[120px] truncate">{displayName}</span>
        <ChevronDown className="w-3 h-3" />
      </Button>

      {menuOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-56 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden animate-fade-in">
            <div className="px-4 py-3 border-b border-border">
              <p className="text-sm font-medium text-foreground">{displayName}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
            <div className="py-1">
              <button
                onClick={() => { navigate("/dashboard"); setMenuOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-secondary transition-colors"
              >
                <History className="w-4 h-4" />
                My Predictions
              </button>
              <button
                onClick={() => { navigate("/creators"); setMenuOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-secondary transition-colors"
              >
                <User className="w-4 h-4" />
                Creator Dashboard
              </button>
              <button
                onClick={() => { navigate("/embeds"); setMenuOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-secondary transition-colors"
              >
                <Settings className="w-4 h-4" />
                Embed Manager
              </button>
              <button
                onClick={async () => { await signOut(); setMenuOpen(false); navigate("/"); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-destructive hover:bg-secondary transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
