
-- Fix: market_options INSERT should check that the user owns the market
DROP POLICY "Authenticated users can create market options" ON public.market_options;
CREATE POLICY "Market creators can insert options"
  ON public.market_options FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.markets WHERE markets.id = market_options.market_id AND markets.creator_id = auth.uid()));

-- Fix: odds_history INSERT should only be from security definer functions (place_bet)
-- Remove the overly permissive policy and rely on the SECURITY DEFINER function
DROP POLICY "System can insert odds history" ON public.odds_history;
