import { useNavigate, useParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";

export default function MarketDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-16 text-center">
        <h1 className="text-2xl font-bold mb-2">Market unavailable</h1>
        <p className="text-muted-foreground mb-6">
          The markets backend is not configured yet (id: {id ?? "—"}).
        </p>
        <Button variant="outline" onClick={() => navigate("/markets")}>
          Back to Markets
        </Button>
      </main>
      <Footer />
    </div>
  );
}
