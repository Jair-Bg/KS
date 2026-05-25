
-- Scheduler
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Resolve a single market to a given outcome ('Yes' / 'No' or any option name).
-- Pays winning bets to profiles.balance, updates total_winnings, marks bets win/lost.
CREATE OR REPLACE FUNCTION public.resolve_market(p_market_id uuid, p_outcome text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_market RECORD;
  v_winners INT := 0;
  v_losers INT := 0;
  v_total_payout NUMERIC := 0;
BEGIN
  SELECT * INTO v_market FROM public.markets WHERE id = p_market_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Market not found'; END IF;
  IF v_market.status = 'resolved' THEN
    RETURN json_build_object('already_resolved', true, 'resolution', v_market.resolution);
  END IF;

  -- Pay winners: balance += potential_payout, total_winnings += profit
  WITH won AS (
    UPDATE public.bets
    SET status = 'won'
    WHERE market_id = p_market_id
      AND lower(option) = lower(p_outcome)
      AND status = 'pending'
    RETURNING user_id, amount, potential_payout
  ),
  pay AS (
    SELECT user_id,
           sum(potential_payout) AS payout,
           sum(potential_payout - amount) AS profit,
           count(*) AS n
    FROM won
    GROUP BY user_id
  ),
  upd AS (
    UPDATE public.profiles p
    SET balance = p.balance + pay.payout,
        total_winnings = p.total_winnings + GREATEST(pay.profit, 0)
    FROM pay
    WHERE p.user_id = pay.user_id
    RETURNING pay.n, pay.payout
  )
  SELECT COALESCE(sum(n), 0), COALESCE(sum(payout), 0)
  INTO v_winners, v_total_payout
  FROM upd;

  -- Mark losers
  WITH lost AS (
    UPDATE public.bets
    SET status = 'lost'
    WHERE market_id = p_market_id
      AND lower(option) <> lower(p_outcome)
      AND status = 'pending'
    RETURNING 1
  )
  SELECT count(*) INTO v_losers FROM lost;

  UPDATE public.markets
  SET status = 'resolved',
      resolution = p_outcome,
      updated_at = now()
  WHERE id = p_market_id;

  RETURN json_build_object(
    'resolution', p_outcome,
    'winners', v_winners,
    'losers', v_losers,
    'total_payout', v_total_payout
  );
END;
$$;

-- Auto-resolve every market whose end_date has passed.
-- Demo heuristic: the side with the higher current odds wins.
-- Ties (50/50) resolve YES.
CREATE OR REPLACE FUNCTION public.auto_resolve_expired_markets()
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  m RECORD;
  v_count INT := 0;
  v_outcome TEXT;
BEGIN
  FOR m IN
    SELECT id, yes_odds, no_odds
    FROM public.markets
    WHERE status = 'active' AND end_date <= now()
    ORDER BY end_date ASC
    LIMIT 200
  LOOP
    v_outcome := CASE WHEN m.yes_odds >= m.no_odds THEN 'Yes' ELSE 'No' END;
    PERFORM public.resolve_market(m.id, v_outcome);
    v_count := v_count + 1;
  END LOOP;
  RETURN v_count;
END;
$$;

-- Schedule every 5 minutes (idempotent)
DO $$
BEGIN
  PERFORM cron.unschedule('auto-resolve-markets');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
  'auto-resolve-markets',
  '*/5 * * * *',
  $$ SELECT public.auto_resolve_expired_markets(); $$
);
