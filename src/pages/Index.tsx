import { LandingHeader } from "@/components/landing/LandingHeader";
import { HeroSection } from "@/components/landing/HeroSection";
import { StatsBar } from "@/components/landing/StatsBar";
import { LiveDemo } from "@/components/landing/LiveDemo";
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
        <LiveDemo />
        <HowItWorks />
        <ValueProps />
        <CreatorCTA />
      </main>
      <Footer />
    </div>
  );
}
