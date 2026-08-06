import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./components/ThemeProvider";
import { Web3Provider } from "./components/Web3Provider";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { CreatorRoute } from "./components/CreatorRoute";
import { AdminRoute } from "./components/AdminRoute";
import AdminDashboard from "./pages/AdminDashboard";
import AdminAudit from "./pages/AdminAudit";
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
import CreatorAuth from "./pages/CreatorAuth";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import OAuthConsent from "./pages/OAuthConsent";
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
            <Route path="/create" element={<CreatorRoute><CreateMarket /></CreatorRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/creator-dashboard" element={<CreatorRoute><CreatorDashboard /></CreatorRoute>} />
            <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
            <Route path="/admin/audit" element={<AdminRoute><AdminAudit /></AdminRoute>} />

            <Route path="/creators" element={<Creators />} />
            <Route path="/embeds" element={<CreatorRoute><EmbedManager /></CreatorRoute>} />
            <Route path="/embed/:id" element={<EmbedView />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/auth/creator" element={<CreatorAuth />} />
            <Route path="/creator-signup" element={<CreatorAuth />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/.lovable/oauth/consent" element={<OAuthConsent />} />
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
