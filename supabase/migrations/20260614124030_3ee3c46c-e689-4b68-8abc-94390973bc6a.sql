
-- 1. Remove profiles from realtime publication (financial data exposure)
ALTER PUBLICATION supabase_realtime DROP TABLE public.profiles;

-- 2. Lock down bets: explicit deny on UPDATE/DELETE for non-service users
CREATE POLICY "No client updates to bets" ON public.bets FOR UPDATE TO authenticated USING (false) WITH CHECK (false);
CREATE POLICY "No client deletes of bets" ON public.bets FOR DELETE TO authenticated USING (false);

-- 3. Scope market_options manage policy to authenticated only
DROP POLICY IF EXISTS "Market creator manages options" ON public.market_options;
CREATE POLICY "Market creator manages options" ON public.market_options
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.markets m WHERE m.id = market_options.market_id AND m.creator_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.markets m WHERE m.id = market_options.market_id AND m.creator_id = auth.uid()));
