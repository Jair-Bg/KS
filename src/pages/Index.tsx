import { LandingHeader } from "@/components/landing/LandingHeader";
import { HeroSection } from "@/components/landing/HeroSection";
import { StatsBar } from "@/components/landing/StatsBar";
import { EmbedShowcase } from "@/components/landing/EmbedShowcase";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { ValueProps } from "@/components/landing/ValueProps";
import { CreatorCTA } from "@/components/landing/CreatorCTA";
import { Footer } from "@/components/Footer";

export default function Index() {
  return (
    <div className="min-h-screen bg-background">
      <LandingHeader />
      <main>
        <HeroSection />
        <StatsBar />
        <EmbedShowcase />
        <HowItWorks />
        <ValueProps />
        <CreatorCTA />
      </main>
      <Footer />
    </div>
  );
}
