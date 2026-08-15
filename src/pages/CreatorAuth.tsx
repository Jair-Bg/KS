import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail, Lock, User, Eye, EyeOff, Sparkles, ArrowLeft, TrendingUp, DollarSign, Zap } from "lucide-react";

export default function CreatorAuth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();

  // Once a session exists (email signup or OAuth return), make sure the
  // creator role is actually granted before entering the dashboard.
  useEffect(() => {
    if (authLoading || !user) return;
    let cancelled = false;
    (async () => {
      try {
        await claimCreatorRole();
      } catch (e) {
        console.error("Failed to activate creator account:", e);
      } finally {
        sessionStorage.removeItem("pending_account_type");
        if (!cancelled) navigate("/creator-dashboard", { replace: true });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, authLoading, navigate]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: displayName, display_name: displayName, account_type: "creator" },
          emailRedirectTo: `${window.location.origin}/auth/creator`,
        },
      });
      if (error) throw error;
      if (data.session) {
        await claimCreatorRole().catch(() => undefined);
        sessionStorage.removeItem("pending_account_type");
        toast({
          title: "Welcome, creator!",
          description: "Your creator account is ready. Launch your first market.",
        });
        navigate("/creator-dashboard");
      } else {
        toast({
          title: "Check your email",
          description: "We sent you a confirmation link to verify your creator account.",
        });
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };


  const handleSocialSignup = async (provider: "google" | "apple") => {
    setSocialLoading(provider);
    try {
      // Persist intent so post-OAuth callback can assign creator role
      sessionStorage.setItem("pending_account_type", "creator");
      const result = await lovable.auth.signInWithOAuth(provider, {
        redirect_uri: `${window.location.origin}/creator-dashboard`,
      });
      if (result.error) {
        toast({ title: "Error", description: result.error.message || "Sign in failed", variant: "destructive" });
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSocialLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-8 items-center">
        {/* Left: pitch */}
        <div className="hidden lg:flex flex-col gap-6 p-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium w-fit">
            <Sparkles className="w-3.5 h-3.5" /> Creator Program
          </div>
          <h1 className="text-4xl font-bold leading-tight">
            Launch markets.<br />
            <span className="gradient-text">Earn from every trade.</span>
          </h1>
          <p className="text-muted-foreground text-lg">
            A dedicated workspace for creators to launch, manage and monetize prediction markets.
          </p>
          <div className="space-y-4 pt-2">
            {[
              { icon: Zap, title: "Launch in minutes", desc: "Spin up your first market with our creator tools." },
              { icon: DollarSign, title: "Earn fees on volume", desc: "Get paid every time someone trades your markets." },
              { icon: TrendingUp, title: "Grow your audience", desc: "Embed markets anywhere and bring your followers in." },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-medium">{title}</div>
                  <div className="text-sm text-muted-foreground">{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: form */}
        <div className="w-full max-w-md mx-auto">
          <div className="mb-6">
            <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-4 h-4" /> Back to Kastia
            </Link>
          </div>
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold">Create your creator account</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              This is a separate flow from trader accounts. You'll get access to the Creator Dashboard, Market Builder and Embeds.
            </p>

            <div className="space-y-3 mb-6">
              <Button variant="outline" className="w-full h-11 gap-3" onClick={() => handleSocialSignup("google")} disabled={!!socialLoading}>
                {socialLoading === "google" ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                )}
                Sign up with Google
              </Button>
              <Button variant="outline" className="w-full h-11 gap-3" onClick={() => handleSocialSignup("apple")} disabled={!!socialLoading}>
                {socialLoading === "apple" ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                  </svg>
                )}
                Sign up with Apple
              </Button>
            </div>

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-card px-3 text-muted-foreground uppercase tracking-wider">or with email</span>
              </div>
            </div>

            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Creator name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="name" placeholder="Shown on your markets" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="pl-10" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10 pr-10" required minLength={6} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full h-11" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Create Creator Account
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-border space-y-2 text-center text-sm text-muted-foreground">
              <p>
                Already a creator?{" "}
                <Link to="/auth" className="text-primary font-medium hover:underline">Sign in</Link>
              </p>
              <p className="text-xs">
                Just want to trade?{" "}
                <Link to="/auth" className="text-foreground hover:underline">Create a trader account</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
