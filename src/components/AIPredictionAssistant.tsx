import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Bot, User, Sparkles } from "lucide-react";
import { Button } from "./ui/button";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

const SUGGESTED_PROMPTS = [
  "What markets are trending right now?",
  "Should I bet Yes on Bitcoin $120k?",
  "Explain how prediction markets work",
  "What's the safest bet this week?",
];

export function AIPredictionAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hey! 👋 I'm your Kastia AI assistant. I can help you understand markets, analyze odds, and decide where to place your predictions. What are you curious about?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const simulateResponse = (userMessage: string) => {
    setIsTyping(true);

    const responses: Record<string, string> = {
      trending:
        "🔥 **Top trending markets right now:**\n\n1. **Bitcoin above $120k by June** — 34% Yes (high volume)\n2. **Kenya opposition wins 2027** — 42% Yes (rising fast)\n3. **Messi in 2026 World Cup** — 71% Yes (community favourite)\n\nWant me to break down any of these?",
      bitcoin:
        "📊 **Bitcoin $120k analysis:**\n\nCurrent odds: **34% Yes** / 66% No\nVolume: $24,500\n\nThe market is pricing this as unlikely but not impossible. If you believe in the halving cycle thesis, the Yes side at 2.94x payout could be a good value bet. However, macro headwinds and regulatory uncertainty are keeping odds low.\n\n**My take:** Consider a small Yes position if you're bullish long-term.",
      explain:
        "🎯 **Prediction markets in 30 seconds:**\n\nYou buy shares in an outcome (Yes or No). Shares are priced 0–100¢ based on what the crowd thinks the probability is.\n\n• Buy **Yes at 34¢** → if it happens, you get **$1** (profit: 66¢)\n• Buy **No at 66¢** → if it doesn't happen, you get **$1** (profit: 34¢)\n\nThe price = the crowd's estimated probability. You profit when you're right and the crowd was wrong. 💡",
      safest:
        "🛡️ **Lower-risk bets this week:**\n\n1. **Messi plays 2026 World Cup** — 71% Yes (strong consensus, decent payout at 1.41x)\n2. **No government shutdown before April** — 62% No (historically likely)\n\nRemember: \"safer\" bets have lower payouts. The edge comes from finding markets where *you* know something the crowd doesn't.",
    };

    const lowerMsg = userMessage.toLowerCase();
    let response =
      "That's a great question! I'm currently in demo mode, but once connected to Kastia's AI backend, I'll be able to give you real-time market analysis, personalized recommendations, and help you place predictions with confidence. 🚀";

    if (lowerMsg.includes("trending") || lowerMsg.includes("trend")) {
      response = responses.trending;
    } else if (lowerMsg.includes("bitcoin") || lowerMsg.includes("btc") || lowerMsg.includes("120k")) {
      response = responses.bitcoin;
    } else if (lowerMsg.includes("explain") || lowerMsg.includes("how") || lowerMsg.includes("work")) {
      response = responses.explain;
    } else if (lowerMsg.includes("safe") || lowerMsg.includes("risk") || lowerMsg.includes("best")) {
      response = responses.safest;
    }

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), role: "assistant", content: response },
      ]);
      setIsTyping(false);
    }, 1200);
  };

  const handleSend = (text?: string) => {
    const msg = text || input.trim();
    if (!msg) return;

    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), role: "user", content: msg },
    ]);
    setInput("");
    simulateResponse(msg);
  };

  return (
    <>
      {/* FAB */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group"
      >
        {open ? (
          <X className="w-5 h-5" />
        ) : (
          <div className="relative">
            <MessageCircle className="w-6 h-6" />
            <Sparkles className="w-3 h-3 absolute -top-1 -right-1 text-primary-foreground animate-pulse" />
          </div>
        )}
      </button>

      {/* Chat Panel */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-[380px] max-h-[560px] bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-fade-in">
          {/* Header */}
          <div className="px-5 py-4 border-b border-border bg-primary/5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                <Bot className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-sm">Kastia AI</h3>
                <p className="text-xs text-muted-foreground">Your prediction assistant</p>
              </div>
              <div className="ml-auto flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                <span className="text-xs text-muted-foreground">Online</span>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[340px]">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                    msg.role === "assistant"
                      ? "bg-primary/10"
                      : "bg-secondary"
                  }`}
                >
                  {msg.role === "assistant" ? (
                    <Bot className="w-3.5 h-3.5 text-primary" />
                  ) : (
                    <User className="w-3.5 h-3.5 text-muted-foreground" />
                  )}
                </div>
                <div
                  className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                    msg.role === "assistant"
                      ? "bg-secondary text-foreground rounded-tl-sm"
                      : "bg-primary text-primary-foreground rounded-tr-sm"
                  }`}
                >
                  <div className="whitespace-pre-line">{msg.content}</div>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-2.5">
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Bot className="w-3.5 h-3.5 text-primary" />
                </div>
                <div className="bg-secondary rounded-2xl rounded-tl-sm px-4 py-3">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}

            {/* Suggested prompts (only show if 1 message) */}
            {messages.length === 1 && !isTyping && (
              <div className="space-y-2 pt-2">
                <p className="text-xs text-muted-foreground font-medium">Try asking:</p>
                {SUGGESTED_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => handleSend(prompt)}
                    className="block w-full text-left text-xs px-3 py-2 rounded-lg border border-border hover:bg-secondary hover:border-primary/20 text-foreground transition-colors"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t border-border p-3">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about any market..."
                className="flex-1 bg-secondary rounded-full px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                disabled={isTyping}
              />
              <Button
                type="submit"
                variant="signup"
                size="icon"
                className="h-9 w-9 shrink-0"
                disabled={!input.trim() || isTyping}
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
