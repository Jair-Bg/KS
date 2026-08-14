
CREATE OR REPLACE FUNCTION public.auto_resolve_expired_markets()
RETURNS integer
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
    WHERE status IN ('active','closed') AND end_date <= now()
    ORDER BY end_date ASC
    LIMIT 200
  LOOP
    v_outcome := CASE WHEN m.yes_odds >= m.no_odds THEN 'Yes' ELSE 'No' END;
    UPDATE public.markets SET status = 'active' WHERE id = m.id AND status = 'closed';
    PERFORM public.resolve_market(m.id, v_outcome);
    v_count := v_count + 1;
  END LOOP;
  RETURN v_count;
END;
$$;

SELECT public.auto_resolve_expired_markets();
