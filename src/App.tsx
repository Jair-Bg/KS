import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./components/ThemeProvider";
import { Web3Provider } from "./components/Web3Provider";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Index from "./pages/Index";
import Markets from "./pages/Markets";
import MarketDetail from "./pages/MarketDetail";
import CreateMarket from "./pages/CreateMarket";
import Dashboard from "./pages/Dashboard";
import CreatorDashboard from "./pages/CreatorDashboard";
import Creators from "./pages/Creators";
import EmbedManager from "./pages/EmbedManager";
import EmbedView from "./pages/EmbedView";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import { AIPredictionAssistant } from "./components/AIPredictionAssistant";

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
    <Web3Provider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/markets" element={<Markets />} />
            <Route path="/market/:id" element={<MarketDetail />} />
            <Route path="/create" element={<ProtectedRoute><CreateMarket /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/creator-dashboard" element={<ProtectedRoute><CreatorDashboard /></ProtectedRoute>} />
            <Route path="/creators" element={<Creators />} />
            <Route path="/embeds" element={<ProtectedRoute><EmbedManager /></ProtectedRoute>} />
            <Route path="/embed/:id" element={<EmbedView />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <AIPredictionAssistant />
        </BrowserRouter>
      </TooltipProvider>
    </Web3Provider>
  </ThemeProvider>
);

export default App;
