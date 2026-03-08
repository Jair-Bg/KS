import { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmbedWidget } from "@/components/EmbedWidget";
import { Sparkles, Link2, Copy, Check, ArrowRight, Loader2 } from "lucide-react";
import { createMarket, type Market } from "@/lib/api";

type Step = "input" | "refine" | "embed";

interface MarketDraft {
  question: string;
  type: "binary" | "multi";
  resolutionDate: string;
  options: string[];
  category: string;
}

export default function CreateMarket() {
  const [step, setStep] = useState<Step>("input");
  const [input, setInput] = useState("");
  const [draft, setDraft] = useState<MarketDraft | null>(null);
  const [publishedMarket, setPublishedMarket] = useState<Market | null>(null);
  const [copied, setCopied] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const handleGenerate = () => {
    // Simulated AI market generation
    const question = input.includes("?") ? input : `Will ${input}?`;
    const category = detectCategory(input);
    setDraft({
      question,
      type: "binary",
      resolutionDate: "2025-06-30",
      options: ["Yes", "No"],
      category,
    });
    setStep("refine");
  };

  const detectCategory = (text: string): string => {
    const lower = text.toLowerCase();
    if (lower.includes("bitcoin") || lower.includes("crypto") || lower.includes("eth")) return "crypto";
    if (lower.includes("election") || lower.includes("trump") || lower.includes("president")) return "politics";
    if (lower.includes("game") || lower.includes("match") || lower.includes("cup")) return "sports";
    if (lower.includes("gpt") || lower.includes("ai") || lower.includes("spacex")) return "tech";
    return "trending";
  };

  const handlePublish = async () => {
    if (!draft) return;
    setPublishing(true);
    try {
      const market = await createMarket({
        question: draft.question,
        type: draft.type,
        resolutionDate: draft.resolutionDate,
        options: draft.options,
        category: draft.category,
      });
      setPublishedMarket(market);
      setStep("embed");
    } catch {
      // Handle error
    } finally {
      setPublishing(false);
    }
  };

  const embedId = publishedMarket?.id || "abc123";
  const embedCode = `<iframe src="https://kastia.app/embed/${embedId}" width="100%" height="200" frameborder="0"></iframe>`;

  const handleCopyEmbed = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-12">
        <div className="max-w-2xl mx-auto">
          {/* Progress */}
          <div className="flex items-center gap-2 mb-12">
            {(["input", "refine", "embed"] as Step[]).map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                  step === s ? "bg-primary text-primary-foreground" : 
                  (["input", "refine", "embed"].indexOf(step) > i ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground")
                }`}>
                  {i + 1}
                </div>
                <span className={`text-sm font-medium ${step === s ? "text-foreground" : "text-muted-foreground"}`}>
                  {s === "input" ? "Describe" : s === "refine" ? "Refine" : "Embed"}
                </span>
                {i < 2 && <div className="w-8 h-px bg-border" />}
              </div>
            ))}
          </div>

          {/* Step 1: Input */}
          {step === "input" && (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-foreground mb-3">Create a prediction market</h1>
                <p className="text-muted-foreground">Paste a URL, share a link, or just type your question.</p>
              </div>

              <div className="relative">
                <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && input.trim() && handleGenerate()}
                  placeholder="e.g., Will Bitcoin hit $150k by December?"
                  className="pl-12 h-14 text-base rounded-xl bg-secondary border-0 focus-visible:ring-2"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {["Paste a YouTube link", "Paste a tweet URL", "Type any question"].map((hint) => (
                  <button
                    key={hint}
                    className="px-3 py-1.5 text-xs rounded-full bg-secondary text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    <Link2 className="w-3 h-3 inline mr-1" />
                    {hint}
                  </button>
                ))}
              </div>

              <Button
                variant="signup"
                size="lg"
                className="w-full h-12 rounded-xl text-base"
                onClick={handleGenerate}
                disabled={!input.trim()}
              >
                Generate Market with AI
                <Sparkles className="w-5 h-5 ml-2" />
              </Button>
            </div>
          )}

          {/* Step 2: Refine */}
          {step === "refine" && draft && (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-foreground mb-3">Refine your market</h1>
                <p className="text-muted-foreground">AI generated a market for you. Edit anything below.</p>
              </div>

              <div className="bg-card rounded-xl border border-border p-6 space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Question</label>
                  <Input
                    value={draft.question}
                    onChange={(e) => setDraft({ ...draft, question: e.target.value })}
                    className="bg-secondary border-0 rounded-lg"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Market type</label>
                    <div className="flex gap-2">
                      <Button
                        variant={draft.type === "binary" ? "oddsActive" : "odds"}
                        size="pill"
                        onClick={() => setDraft({ ...draft, type: "binary", options: ["Yes", "No"] })}
                      >
                        Yes / No
                      </Button>
                      <Button
                        variant={draft.type === "multi" ? "oddsActive" : "odds"}
                        size="pill"
                        onClick={() => setDraft({ ...draft, type: "multi", options: ["Option A", "Option B", "Option C"] })}
                      >
                        Multi
                      </Button>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Resolution date</label>
                    <Input
                      type="date"
                      value={draft.resolutionDate}
                      onChange={(e) => setDraft({ ...draft, resolutionDate: e.target.value })}
                      className="bg-secondary border-0 rounded-lg"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Category</label>
                  <div className="flex flex-wrap gap-2">
                    {["trending", "politics", "sports", "crypto", "tech", "culture", "economics"].map((cat) => (
                      <Button
                        key={cat}
                        variant={draft.category === cat ? "oddsActive" : "odds"}
                        size="pill"
                        onClick={() => setDraft({ ...draft, category: cat })}
                        className="capitalize"
                      >
                        {cat}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Preview */}
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">Preview</label>
                <EmbedWidget
                  question={draft.question}
                  yesOdds={50}
                  noOdds={50}
                  volume="$0"
                />
              </div>

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setStep("input")}>
                  Back
                </Button>
                <Button variant="signup" className="flex-1 rounded-xl" onClick={handlePublish} disabled={publishing}>
                  {publishing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-1" />
                      Publishing...
                    </>
                  ) : (
                    <>
                      Publish Market
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Embed */}
          {step === "embed" && (draft || publishedMarket) && (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-success" />
                </div>
                <h1 className="text-3xl font-bold text-foreground mb-3">Market is live! 🎉</h1>
                <p className="text-muted-foreground">Embed it anywhere to start collecting predictions.</p>
              </div>

              <EmbedWidget
                marketId={embedId}
                question={publishedMarket?.question || draft?.question || ""}
                yesOdds={50}
                noOdds={50}
                volume="$0"
              />

              <div className="bg-card rounded-xl border border-border p-6 space-y-4">
                <label className="text-sm font-medium text-foreground block">Embed code</label>
                <div className="bg-secondary rounded-lg p-4 font-mono text-xs text-muted-foreground break-all">
                  {embedCode}
                </div>
                <Button variant="outline" className="w-full rounded-xl" onClick={handleCopyEmbed}>
                  {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                  {copied ? "Copied!" : "Copy Embed Code"}
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="rounded-xl" onClick={() => { setStep("input"); setInput(""); setDraft(null); setPublishedMarket(null); }}>
                  Create Another
                </Button>
                <Button variant="signup" className="rounded-xl" asChild>
                  <a href="/dashboard">View Dashboard</a>
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
