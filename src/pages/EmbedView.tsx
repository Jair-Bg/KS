import { useParams } from "react-router-dom";
import { EmbedWidget } from "@/components/EmbedWidget";

// Standalone embed page — designed to be loaded inside an iframe on any external site
// No header/footer, minimal chrome, transparent-friendly

const mockMarkets: Record<string, { question: string; yesOdds: number; noOdds: number; volume: string }> = {
  abc123: { question: "Bitcoin above $120k by June 2025?", yesOdds: 34, noOdds: 66, volume: "$2.4M" },
  def456: { question: "Kenya opposition wins 2027 presidential election?", yesOdds: 42, noOdds: 58, volume: "$180K" },
  ghi789: { question: "Will Messi play in the 2026 World Cup?", yesOdds: 71, noOdds: 29, volume: "$1.1M" },
  live001: { question: "Streamer reaches 10K viewers this session?", yesOdds: 55, noOdds: 45, volume: "$12K" },
  live002: { question: "Will he rage-quit in the next 30 minutes?", yesOdds: 38, noOdds: 62, volume: "$8.5K" },
};

export default function EmbedView() {
  const { id } = useParams<{ id: string }>();
  const market = mockMarkets[id || ""] || mockMarkets.abc123;

  return (
    <div className="min-h-screen bg-transparent p-2">
      <EmbedWidget
        question={market.question}
        yesOdds={market.yesOdds}
        noOdds={market.noOdds}
        volume={market.volume}
      />
    </div>
  );
}
