import { useState } from "react";
import { CreatorLayout } from "@/components/creator/CreatorLayout";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { Sparkles, Link2, Copy, Check, ArrowRight, Loader2, Plus, X } from "lucide-react";
import { createMarket, type Market } from "@/lib/api";

type Step = "input" | "refine" | "embed";

interface MarketDraft {
  question: string;
  market_type: "binary" | "multi";
  end_date: string;
  category: string;
  options: string[];
  engine: "amm" | "clob";
}

export default function CreateMarket() {
  const [step, setStep] = useState<Step>("input");
  const [input, setInput] = useState("");
  const [draft, setDraft] = useState<MarketDraft | null>(null);
  const [publishedMarket, setPublishedMarket] = useState<Market | null>(null);
  const [copied, setCopied] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState("");

  // Default resolution date: 30 days out (never a date in the past).
  const defaultEndDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().slice(0, 10);
  };
  const minEndDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  };

  const handleGenerate = () => {
    const question = input.includes("?") ? input : `Will ${input}?`;
    const category = detectCategory(input);
    setDraft({
      question,
      market_type: "binary",
      end_date: defaultEndDate(),
      category,
      options: ["Option A", "Option B", "Option C"],
      engine: "amm",
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
    setError("");
    try {
      const market = await createMarket({
        question: draft.question,
        category: draft.category,
        market_type: draft.market_type,
        end_date: new Date(draft.end_date).toISOString(),
        options: draft.market_type === "multi" ? draft.options.filter((o) => o.trim()) : undefined,
        engine: draft.engine,
      });
      setPublishedMarket(market);
      setStep("embed");
    } catch (e: any) {
      setError(e.message || "Failed to create market");
    } finally {
      setPublishing(false);
    }
  };

  const addOption = () => {
    if (draft && draft.options.length < 8) {
      setDraft({ ...draft, options: [...draft.options, ""] });
    }
  };

  const removeOption = (index: number) => {
    if (draft && draft.options.length > 2) {
      setDraft({ ...draft, options: draft.options.filter((_, i) => i !== index) });
    }
  };

  const updateOption = (index: number, value: string) => {
    if (draft) {
      const newOptions = [...draft.options];
      newOptions[index] = value;
      setDraft({ ...draft, options: newOptions });
    }
  };

  const embedId = publishedMarket?.id || "preview";
  const baseUrl = window.location.origin;
  const embedCode = `<iframe src="${baseUrl}/embed/${embedId}" width="100%" height="200" frameborder="0" style="border:none;border-radius:12px;"></iframe>`;

  const handleCopyEmbed = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <CreatorLayout title="New Market" description="Describe your question, refine the details, then publish and embed it.">
      <div>
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
                  placeholder="e.g., Who will win the 2028 presidential election?"
                  className="pl-12 h-14 text-base rounded-xl bg-secondary border-0 focus-visible:ring-2"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {["Yes/No market", "Multi-outcome", "Sports prediction", "Political forecast"].map((hint) => (
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
                        variant={draft.market_type === "binary" ? "oddsActive" : "odds"}
                        size="pill"
                        onClick={() => setDraft({ ...draft, market_type: "binary" })}
                      >
                        Yes / No
                      </Button>
                      <Button
                        variant={draft.market_type === "multi" ? "oddsActive" : "odds"}
                        size="pill"
                        onClick={() => setDraft({ ...draft, market_type: "multi" })}
                      >
                        Multi
                      </Button>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Resolution date</label>
                    <Input
                      type="date"
                      value={draft.end_date}
                      onChange={(e) => setDraft({ ...draft, end_date: e.target.value })}
                      className="bg-secondary border-0 rounded-lg"
                    />
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Matching engine</label>
                  <div className="flex gap-2">
                    <Button
                      variant={draft.engine === "amm" ? "oddsActive" : "odds"}
                      size="pill"
                      onClick={() => setDraft({ ...draft, engine: "amm" })}
                    >
                      AMM (instant)
                    </Button>
                    <Button
                      variant={draft.engine === "clob" ? "oddsActive" : "odds"}
                      size="pill"
                      onClick={() => setDraft({ ...draft, engine: "clob" })}
                    >
                      CLOB (order book + minting)
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5">
                    CLOB enables limit orders, an order book, and atomic YES/NO minting on complementary fills.
                  </p>
                </div>

                </div>

                {/* Multi-outcome options editor */}
                {draft.market_type === "multi" && (
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Outcomes</label>
                    <div className="space-y-2">
                      {draft.options.map((opt, i) => (
                        <div key={i} className="flex gap-2">
                          <Input
                            value={opt}
                            onChange={(e) => updateOption(i, e.target.value)}
                            placeholder={`Outcome ${i + 1}`}
                            className="bg-secondary border-0 rounded-lg"
                          />
                          {draft.options.length > 2 && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="shrink-0"
                              onClick={() => removeOption(i)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                    {draft.options.length < 8 && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={addOption}
                      >
                        <Plus className="w-4 h-4 mr-1" /> Add outcome
                      </Button>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      Each outcome will start at equal odds (100% ÷ number of outcomes)
                    </p>
                  </div>
                )}

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
                {draft.market_type === "binary" ? (
                  <div className="rounded-xl border border-primary/20 bg-card p-4">
                    <p className="font-semibold text-foreground text-sm mb-3">{draft.question}</p>
                    <div className="flex gap-2">
                      <div className="flex-1 text-center text-sm py-1.5 rounded-full bg-primary/10 text-primary font-medium">Yes 50%</div>
                      <div className="flex-1 text-center text-sm py-1.5 rounded-full bg-muted text-muted-foreground font-medium">No 50%</div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-primary/20 bg-card p-4">
                    <p className="font-semibold text-foreground text-sm mb-3">{draft.question}</p>
                    <div className="space-y-2">
                      {draft.options.filter((o) => o.trim()).map((opt, i) => (
                        <div key={i} className="flex justify-between items-center text-sm">
                          <span className="text-foreground">{opt}</span>
                          <span className="text-muted-foreground">
                            {(100 / draft.options.filter((o) => o.trim()).length).toFixed(0)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {error && <p className="text-sm text-destructive text-center">{error}</p>}

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
          {step === "embed" && publishedMarket && (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-success" />
                </div>
                <h1 className="text-3xl font-bold text-foreground mb-3">Market is live! 🎉</h1>
                <p className="text-muted-foreground">Embed it anywhere to start collecting predictions.</p>
              </div>

              <div className="rounded-xl border border-primary/20 bg-card p-4">
                <p className="font-semibold text-foreground text-sm mb-3">{publishedMarket.question}</p>
                <div className="flex gap-2">
                  <div className="flex-1 text-center text-sm py-1.5 rounded-full bg-primary/10 text-primary font-medium">Yes {Math.round(publishedMarket.yes_odds)}%</div>
                  <div className="flex-1 text-center text-sm py-1.5 rounded-full bg-muted text-muted-foreground font-medium">No {Math.round(publishedMarket.no_odds)}%</div>
                </div>
              </div>

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
                  <a href={`/market/${publishedMarket.id}`}>View Market</a>
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </CreatorLayout>

  );
}
