import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Markets from "./pages/Markets";
import CreateMarket from "./pages/CreateMarket";
import Dashboard from "./pages/Dashboard";
import Creators from "./pages/Creators";
import EmbedManager from "./pages/EmbedManager";
import EmbedView from "./pages/EmbedView";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import { AIPredictionAssistant } from "./components/AIPredictionAssistant";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/markets" element={<Markets />} />
          <Route path="/create" element={<CreateMarket />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/creators" element={<Creators />} />
          <Route path="/embeds" element={<EmbedManager />} />
          <Route path="/embed/:id" element={<EmbedView />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        <AIPredictionAssistant />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
