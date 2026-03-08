import { useState } from "react";
import { Button } from "./ui/button";
import { TrendingUp } from "lucide-react";

interface EmbedWidgetProps {
  question: string;
  yesOdds: number;
  noOdds: number;
  volume?: string;
  compact?: boolean;
}

export function EmbedWidget({ question, yesOdds, noOdds, volume, compact = false }: EmbedWidgetProps) {
  const [selected, setSelected] = useState<"yes" | "no" | null>(null);

  return (
    <div className={`rounded-xl border border-primary/20 bg-card overflow-hidden ${compact ? 'p-3' : 'p-5'}`}>
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="w-4 h-4 text-primary" />
        <span className="text-xs font-semibold text-primary uppercase tracking-wider">Kastia</span>
      </div>
      <p className={`font-semibold text-foreground mb-3 leading-tight ${compact ? 'text-sm' : 'text-base'}`}>
        {question}
      </p>
      <div className="flex gap-2">
        <Button
          variant={selected === "yes" ? "oddsActive" : "odds"}
          size="pill"
          className="flex-1"
          onClick={() => setSelected("yes")}
        >
          Yes {yesOdds}%
        </Button>
        <Button
          variant={selected === "no" ? "oddsActive" : "odds"}
          size="pill"
          className="flex-1"
          onClick={() => setSelected("no")}
        >
          No {noOdds}%
        </Button>
      </div>
      {volume && (
        <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
          <span>{volume} vol</span>
          <span className="text-primary hover:underline cursor-pointer">Trade on Kastia →</span>
        </div>
      )}
    </div>
  );
}
