import { Header } from "@/components/Header";
import { HeroSection } from "@/components/landing/HeroSection";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { ValueProps } from "@/components/landing/ValueProps";
import { EmbedShowcase } from "@/components/landing/EmbedShowcase";
import { CreatorCTA } from "@/components/landing/CreatorCTA";
import { Footer } from "@/components/Footer";

export default function Index() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection />
        <EmbedShowcase />
        <HowItWorks />
        <ValueProps />
        <CreatorCTA />
      </main>
      <Footer />
    </div>
  );
}
