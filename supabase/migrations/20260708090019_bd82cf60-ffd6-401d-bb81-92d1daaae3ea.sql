
-- 1) Tighten orders SELECT: owner-only
DROP POLICY IF EXISTS "Orders are public for book depth" ON public.orders;

CREATE POLICY "Users view own orders"
  ON public.orders FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 2) Public, sanitized order book view (no user_id)
DROP VIEW IF EXISTS public.order_book;
CREATE VIEW public.order_book
WITH (security_invoker = false) AS
SELECT
  id,
  market_id,
  side,
  contract,
  price,
  quantity,
  filled,
  (quantity - filled) AS remaining,
  status,
  is_mm,
  created_at
FROM public.orders
WHERE status = 'open';

GRANT SELECT ON public.order_book TO anon, authenticated;

-- 3) Remove sensitive tables from realtime broadcast
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'bets'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE public.bets';
  END IF;
END $$;
