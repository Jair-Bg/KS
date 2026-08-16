import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { Copy, Check, Code2, Monitor, Smartphone, Tv, MessageSquare, Globe, Youtube, Twitch, Loader2, Sun, Moon, Sparkles, Maximize2, LoaderCircle } from "lucide-react";
import { fetchCreatorMarkets, fetchMarkets, formatVolume, type Market } from "@/lib/api";

type EmbedFormat = "iframe" | "script" | "link";
type EmbedSize = "compact" | "standard" | "large";
type EmbedTheme = "auto" | "light" | "dark";

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
  const [theme, setTheme] = useState<EmbedTheme>("auto");
  const [responsive, setResponsive] = useState(true);
  const [spinner, setSpinner] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        let m = await fetchCreatorMarkets();
        // Demo fallback: if user has no markets yet, show all active markets so embeds are demoable.
        if (m.length === 0) {
          m = await fetchMarkets();
        }
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

  const buildQuery = (ref: string) => {
    const parts = [`ref=${ref}`];
    if (size === "compact") parts.push("compact=true");
    parts.push(`theme=${theme}`);
    parts.push(`spinner=${spinner ? "true" : "false"}`);
    return "?" + parts.join("&");
  };

  const getEmbedCode = () => {
    if (!selectedMarket) return "";
    const embedUrl = `${baseUrl}/embed/${selectedMarket.id}${buildQuery("embed")}`;
    const widthAttr = responsive ? "100%" : customWidth;
    const styleExtra = responsive ? "max-width:100%;width:100%;" : "";
    switch (format) {
      case "iframe":
        return `<iframe src="${embedUrl}" width="${widthAttr}" height="${customHeight}px" frameborder="0" style="border-radius:12px;overflow:hidden;${styleExtra}" allow="clipboard-write" loading="lazy"></iframe>`;
      case "script":
        return `<div id="kastia-embed-${selectedMarket.id}"></div>\n<script src="${baseUrl}/sdk/embed.js" data-market="${selectedMarket.id}" data-size="${size}" data-theme="${theme}" data-responsive="${responsive}" data-spinner="${spinner}"></script>`;
      case "link":
        return `${baseUrl}/embed/${selectedMarket.id}${buildQuery("link")}`;
    }
  };

  const handleCopy = () => {
    if (!selectedMarket) return;
    navigator.clipboard.writeText(getEmbedCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <CreatorLayout
      title="Embed Toolkit"
      description="Generate embeddable widgets for any platform — YouTube live, Twitch, blogs or newsletters. Your audience bets without leaving the content."
    >
      <div>
        <div className="max-w-5xl mx-auto">


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

                <h3 className="font-semibold text-foreground pt-2">Theme</h3>
                <div className="flex gap-2">
                  {([
                    { key: "auto" as EmbedTheme, label: "Auto", icon: Sparkles },
                    { key: "light" as EmbedTheme, label: "Light", icon: Sun },
                    { key: "dark" as EmbedTheme, label: "Dark", icon: Moon },
                  ]).map((t) => (
                    <Button
                      key={t.key}
                      variant={theme === t.key ? "oddsActive" : "odds"}
                      size="pill"
                      onClick={() => setTheme(t.key)}
                      className="gap-1.5"
                    >
                      <t.icon className="w-3.5 h-3.5" />
                      {t.label}
                    </Button>
                  ))}
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  <Button
                    variant={responsive ? "oddsActive" : "odds"}
                    size="pill"
                    onClick={() => setResponsive((v) => !v)}
                    className="gap-1.5"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                    Responsive width {responsive ? "On" : "Off"}
                  </Button>
                  <Button
                    variant={spinner ? "oddsActive" : "odds"}
                    size="pill"
                    onClick={() => setSpinner((v) => !v)}
                    className="gap-1.5"
                  >
                    <LoaderCircle className="w-3.5 h-3.5" />
                    Loading spinner {spinner ? "On" : "Off"}
                  </Button>
                </div>

                {format === "iframe" && !responsive && (
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
                {format === "iframe" && responsive && (
                  <div className="pt-2">
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Height (px)</label>
                    <Input value={customHeight} onChange={(e) => setCustomHeight(e.target.value)} className="bg-secondary border-0 h-9 text-sm max-w-[160px]" />
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

                <div className="bg-card border border-border rounded-xl overflow-hidden">
                  <div className="bg-secondary/60 px-4 py-2.5 flex items-center gap-2 border-b border-border">
                    <div className="flex gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-destructive/60" />
                      <div className="w-2.5 h-2.5 rounded-full bg-accent/60" />
                      <div className="w-2.5 h-2.5 rounded-full bg-primary/40" />
                    </div>
                    <div className="flex-1 bg-secondary rounded-md px-3 py-1 text-[10px] text-muted-foreground truncate">
                      example.com/article
                    </div>
                  </div>
                  <div className="p-4">
                    {selectedMarket ? (
                      <iframe
                        key={`${selectedMarket.id}-${size}-${theme}-${spinner}-${responsive}`}
                        src={`/embed/${selectedMarket.id}${buildQuery("preview")}`}
                        width="100%"
                        height={size === "compact" ? 170 : size === "large" ? 300 : 220}
                        frameBorder="0"
                        title="Embed preview"
                        style={{ border: "none", borderRadius: 12, overflow: "hidden", maxWidth: responsive ? "100%" : 520 }}
                      />
                    ) : (
                      <div className="text-sm text-muted-foreground text-center py-10">
                        Select a market to preview your embed.
                      </div>
                    )}
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
