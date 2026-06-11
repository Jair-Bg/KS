
CREATE OR REPLACE FUNCTION public.get_creator_analytics(p_days integer DEFAULT 30)
RETURNS json
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_since timestamptz := now() - (p_days || ' days')::interval;
  v_result json;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  WITH my_markets AS (
    SELECT id, category, question, volume, total_traders, embed_views, status, created_at
    FROM public.markets
    WHERE creator_id = v_uid
  ),
  my_bets AS (
    SELECT b.*, m.category, m.question, m.id AS mid
    FROM public.bets b
    JOIN my_markets m ON m.id = b.market_id
  ),
  daily AS (
    SELECT
      to_char(d::date, 'YYYY-MM-DD') AS day,
      COALESCE(SUM(b.amount), 0)::numeric AS volume,
      COUNT(b.id)::int AS bets
    FROM generate_series(v_since::date, now()::date, '1 day'::interval) d
    LEFT JOIN my_bets b ON b.created_at::date = d::date
    GROUP BY d
    ORDER BY d
  ),
  by_category AS (
    SELECT category, COALESCE(SUM(volume), 0)::numeric AS volume, COUNT(*)::int AS markets
    FROM my_markets
    GROUP BY category
    ORDER BY volume DESC
  ),
  top_markets AS (
    SELECT id, question, category, volume, total_traders, embed_views, status
    FROM my_markets
    ORDER BY volume DESC
    LIMIT 5
  ),
  totals AS (
    SELECT
      (SELECT COUNT(DISTINCT user_id) FROM my_bets) AS unique_traders,
      (SELECT COUNT(*) FROM my_bets) AS total_bets,
      (SELECT COALESCE(AVG(amount), 0) FROM my_bets) AS avg_bet,
      (SELECT COALESCE(SUM(amount), 0) FROM my_bets WHERE created_at >= v_since) AS volume_period
  )
  SELECT json_build_object(
    'daily', COALESCE((SELECT json_agg(daily) FROM daily), '[]'::json),
    'by_category', COALESCE((SELECT json_agg(by_category) FROM by_category), '[]'::json),
    'top_markets', COALESCE((SELECT json_agg(top_markets) FROM top_markets), '[]'::json),
    'totals', (SELECT row_to_json(totals) FROM totals)
  ) INTO v_result;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_creator_analytics(integer) TO authenticated;
