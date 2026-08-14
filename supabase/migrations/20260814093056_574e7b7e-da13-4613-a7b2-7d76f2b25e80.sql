
CREATE TEMP TABLE demo_ids AS
SELECT id FROM public.markets
WHERE created_at IN (
  '2026-04-15 07:56:34.756616+00',
  '2026-05-02 09:55:41.082208+00',
  '2026-05-08 08:45:33.978372+00'
);

DELETE FROM public.trades WHERE market_id IN (SELECT id FROM demo_ids);
DELETE FROM public.orders WHERE market_id IN (SELECT id FROM demo_ids);
DELETE FROM public.positions WHERE market_id IN (SELECT id FROM demo_ids);
DELETE FROM public.mm_inventory WHERE market_id IN (SELECT id FROM demo_ids);
DELETE FROM public.odds_history WHERE market_id IN (SELECT id FROM demo_ids);
DELETE FROM public.watchlist WHERE market_id IN (SELECT id FROM demo_ids);
DELETE FROM public.bets WHERE market_id IN (SELECT id FROM demo_ids);
DELETE FROM public.market_options WHERE market_id IN (SELECT id FROM demo_ids);
DELETE FROM public.markets WHERE id IN (SELECT id FROM demo_ids);

-- Close any market whose deadline has already passed
UPDATE public.markets
SET status = 'closed', updated_at = now()
WHERE status = 'active' AND end_date <= now();
