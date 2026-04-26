import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { Copy, Check, Code2, Monitor, Smartphone, Tv, MessageSquare, Globe, Youtube, Twitch, Loader2 } from "lucide-react";
import { fetchCreatorMarkets, formatVolume, type Market } from "@/lib/api";

type EmbedFormat = "iframe" | "script" | "link";
type EmbedSize = "compact" | "standard" | "large";

const platformExamples = [
  { icon: Youtube, name: "YouTube", desc: "Add to video descriptions or live chat panels" },
  { icon: Twitch, name: "Twitch", desc: "Overlay on stream or pin in chat" },
  { icon: Globe, name: "Blog / Website", desc: "Embed directly in articles or sidebars" },
  { icon: MessageSquare, name: "Discord / Telegram", desc: "Share link embeds in channels" },
];

export default function EmbedManager() {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loadingMarkets, setLoadingMarkets] = useState(true);
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null);
  const [format, setFormat] = useState<EmbedFormat>("iframe");
  const [size, setSize] = useState<EmbedSize>("standard");
  const [copied, setCopied] = useState(false);
  const [customWidth, setCustomWidth] = useState("100%");
  const [customHeight, setCustomHeight] = useState("220");

  useEffect(() => {
    (async () => {
      try {
        const m = await fetchCreatorMarkets();
        setMarkets(m);
        if (m.length > 0) setSelectedMarket(m[0]);
      } catch (e) {
        console.error("Failed to load markets:", e);
      } finally {
        setLoadingMarkets(false);
      }
    })();
  }, []);

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://kastia.lovable.app";

  const getEmbedCode = () => {
    if (!selectedMarket) return "";
    const sizeParam = size === "compact" ? "&compact=true" : "";
    const embedUrl = `${baseUrl}/embed/${selectedMarket.id}`;
    switch (format) {
      case "iframe":
        return `<iframe src="${embedUrl}?ref=embed${sizeParam}" width="${customWidth}" height="${customHeight}px" frameborder="0" style="border-radius:12px;overflow:hidden;" allow="clipboard-write"></iframe>`;
      case "script":
        return `<div id="kastia-embed-${selectedMarket.id}"></div>\n<script src="${baseUrl}/sdk/embed.js" data-market="${selectedMarket.id}" data-size="${size}"></script>`;
      case "link":
        return embedUrl;
    }
  };

  const handleCopy = () => {
    if (!selectedMarket) return;
    navigator.clipboard.writeText(getEmbedCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-12">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-3">
              Embed Toolkit
            </span>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
              Put Predictions Everywhere
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Generate embeddable widgets for any platform. Your audience bets without leaving the content — YouTube live, Twitch streams, blogs, or newsletters.
            </p>
          </div>

          {/* Platform examples */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
            {platformExamples.map((p) => (
              <div key={p.name} className="bg-card border border-border rounded-xl p-4 text-center hover:border-primary/30 transition-colors">
                <p.icon className="w-6 h-6 text-primary mx-auto mb-2" />
                <div className="text-sm font-semibold text-foreground">{p.name}</div>
                <div className="text-xs text-muted-foreground mt-1">{p.desc}</div>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-[1fr,380px] gap-8">
            {/* Controls */}
            <div className="space-y-6">
              {/* Market selector */}
              <div className="bg-card border border-border rounded-xl p-5 space-y-4">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-primary" /> Select Market
                </h3>
                {loadingMarkets ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  </div>
                ) : markets.length === 0 ? (
                  <div className="text-center py-6 text-sm text-muted-foreground">
                    You haven't created any markets yet.{" "}
                    <a href="/create" className="text-primary hover:underline">Create one</a> to generate embeds.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {markets.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => setSelectedMarket(m)}
                        className={`text-left p-3 rounded-lg border transition-all text-sm ${
                          selectedMarket?.id === m.id
                            ? "border-primary bg-primary/5 text-foreground"
                            : "border-border bg-secondary/30 text-muted-foreground hover:border-primary/20"
                        }`}
                      >
                        <div className="font-medium leading-tight line-clamp-2">{m.question}</div>
                        <div className="text-xs mt-1 opacity-70">{formatVolume(m.volume)} vol</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Format & Size */}
              <div className="bg-card border border-border rounded-xl p-5 space-y-4">
                <h3 className="font-semibold text-foreground">Embed Format</h3>
                <div className="flex gap-2">
                  {([
                    { key: "iframe" as EmbedFormat, label: "iFrame", icon: Monitor },
                    { key: "script" as EmbedFormat, label: "Script Tag", icon: Code2 },
                    { key: "link" as EmbedFormat, label: "Direct Link", icon: Globe },
                  ]).map((f) => (
                    <Button
                      key={f.key}
                      variant={format === f.key ? "oddsActive" : "odds"}
                      size="pill"
                      onClick={() => setFormat(f.key)}
                      className="gap-1.5"
                    >
                      <f.icon className="w-3.5 h-3.5" />
                      {f.label}
                    </Button>
                  ))}
                </div>

                <h3 className="font-semibold text-foreground pt-2">Widget Size</h3>
                <div className="flex gap-2">
                  {([
                    { key: "compact" as EmbedSize, label: "Compact", icon: Smartphone },
                    { key: "standard" as EmbedSize, label: "Standard", icon: Monitor },
                    { key: "large" as EmbedSize, label: "Large", icon: Tv },
                  ]).map((s) => (
                    <Button
                      key={s.key}
                      variant={size === s.key ? "oddsActive" : "odds"}
                      size="pill"
                      onClick={() => setSize(s.key)}
                      className="gap-1.5"
                    >
                      <s.icon className="w-3.5 h-3.5" />
                      {s.label}
                    </Button>
                  ))}
                </div>

                {format === "iframe" && (
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">Width</label>
                      <Input value={customWidth} onChange={(e) => setCustomWidth(e.target.value)} className="bg-secondary border-0 h-9 text-sm" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">Height (px)</label>
                      <Input value={customHeight} onChange={(e) => setCustomHeight(e.target.value)} className="bg-secondary border-0 h-9 text-sm" />
                    </div>
                  </div>
                )}
              </div>

              {/* Generated code */}
              <div className="bg-card border border-border rounded-xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-foreground">Embed Code</h3>
                  <Button variant="ghost" size="pill" onClick={handleCopy} className="gap-1.5 text-xs">
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? "Copied!" : "Copy"}
                  </Button>
                </div>
                <pre className="bg-secondary rounded-lg p-4 font-mono text-xs text-muted-foreground overflow-x-auto whitespace-pre-wrap break-all leading-relaxed">
                  {getEmbedCode()}
                </pre>
              </div>

              {/* Live stream use case callout */}
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-5">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Tv className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">Live Stream Mode</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Perfect for YouTube Live, Twitch, or TikTok. Your audience sees the prediction widget as an overlay or in the chat panel — they can vote on what happens next without switching tabs. Create real-time markets like "Will he beat this boss?" or "Next song request?"
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className="space-y-4">
              <div className="sticky top-24">
                <h3 className="text-sm font-semibold text-muted-foreground mb-3">Live Preview</h3>
                
                {/* Browser mock */}
                <div className="bg-card border border-border rounded-xl overflow-hidden">
                  <div className="bg-secondary/60 px-4 py-2.5 flex items-center gap-2 border-b border-border">
                    <div className="flex gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-destructive/60" />
                      <div className="w-2.5 h-2.5 rounded-full bg-accent/60" />
                      <div className="w-2.5 h-2.5 rounded-full bg-primary/40" />
                    </div>
                    <div className="flex-1 bg-secondary rounded-md px-3 py-1 text-[10px] text-muted-foreground truncate">
                      youtube.com/watch?v=live_stream
                    </div>
                  </div>
                  <div className="p-4 space-y-3">
                    {/* Fake video area */}
                    <div className="w-full aspect-video bg-muted rounded-lg flex items-center justify-center relative">
                      <span className="text-3xl">▶️</span>
                      <div className="absolute bottom-2 left-2 text-[10px] bg-destructive text-destructive-foreground px-1.5 py-0.5 rounded font-medium">
                        ● LIVE
                      </div>
                    </div>
                    <div className="rounded-xl border border-primary/20 bg-card p-3">
                      <p className={`font-semibold text-foreground mb-2 ${size === "compact" ? "text-xs" : "text-sm"}`}>{selectedMarket.question}</p>
                      <div className="flex gap-2">
                        <div className="flex-1 text-center text-xs py-1.5 rounded-full bg-primary/10 text-primary font-medium">Yes {selectedMarket.yesOdds}%</div>
                        <div className="flex-1 text-center text-xs py-1.5 rounded-full bg-muted text-muted-foreground font-medium">No {selectedMarket.noOdds}%</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Chat panel mock */}
                <div className="mt-4 bg-card border border-border rounded-xl overflow-hidden">
                  <div className="px-4 py-2.5 border-b border-border bg-secondary/40">
                    <span className="text-xs font-semibold text-foreground">Live Chat</span>
                  </div>
                  <div className="p-3 space-y-2 text-xs">
                    <div><span className="text-primary font-medium">@viewer1:</span> <span className="text-muted-foreground">I'm voting YES 🔥</span></div>
                    <div><span className="text-primary font-medium">@viewer2:</span> <span className="text-muted-foreground">No way, going with NO</span></div>
                    <div><span className="text-primary font-medium">@viewer3:</span> <span className="text-muted-foreground">This is so cool, bet right from the stream!</span></div>
                    <div className="border border-primary/20 rounded-lg p-2 bg-primary/5">
                      <span className="text-[10px] text-primary font-semibold">📊 PREDICTION:</span>
                      <span className="text-muted-foreground ml-1">{selectedMarket.question}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
