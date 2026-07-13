
-- 1) Fix place_bet: enforce auth.uid() = p_user_id
CREATE OR REPLACE FUNCTION public.place_bet(p_market_id uuid, p_user_id uuid, p_option text, p_amount numeric)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_market RECORD;
  v_profile RECORD;
  v_current_odds NUMERIC;
  v_new_yes NUMERIC;
  v_new_no NUMERIC;
  v_payout NUMERIC;
  v_bet_id UUID;
  v_shift NUMERIC;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT * INTO v_market FROM public.markets WHERE id = p_market_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Market not found'; END IF;
  IF v_market.status <> 'active' THEN RAISE EXCEPTION 'Market is not active'; END IF;

  SELECT * INTO v_profile FROM public.profiles WHERE user_id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Profile not found'; END IF;
  IF v_profile.balance < p_amount THEN RAISE EXCEPTION 'Insufficient balance'; END IF;

  IF lower(p_option) = 'yes' THEN
    v_current_odds := v_market.yes_odds;
  ELSE
    v_current_odds := v_market.no_odds;
  END IF;

  v_payout := (p_amount * 100.0) / GREATEST(v_current_odds, 1);

  v_shift := LEAST(20, (p_amount / GREATEST(v_market.volume + p_amount, 100)) * 30);
  IF lower(p_option) = 'yes' THEN
    v_new_yes := LEAST(98, v_market.yes_odds + v_shift);
    v_new_no := 100 - v_new_yes;
  ELSE
    v_new_no := LEAST(98, v_market.no_odds + v_shift);
    v_new_yes := 100 - v_new_no;
  END IF;

  INSERT INTO public.bets (market_id, user_id, option, amount, odds_at_time, potential_payout)
  VALUES (p_market_id, p_user_id, p_option, p_amount, v_current_odds, v_payout)
  RETURNING id INTO v_bet_id;

  UPDATE public.markets
  SET yes_odds = v_new_yes,
      no_odds = v_new_no,
      volume = volume + p_amount,
      total_traders = total_traders + 1
  WHERE id = p_market_id;

  UPDATE public.profiles
  SET balance = balance - p_amount,
      total_bets = total_bets + 1
  WHERE user_id = p_user_id;

  INSERT INTO public.odds_history (market_id, yes_odds, no_odds)
  VALUES (p_market_id, v_new_yes, v_new_no);

  RETURN json_build_object(
    'bet_id', v_bet_id,
    'odds', v_current_odds,
    'payout', v_payout,
    'new_yes_odds', v_new_yes,
    'new_no_odds', v_new_no
  );
END;
$function$;

-- 2) Fix SECURITY DEFINER views: convert to security_invoker
ALTER VIEW public.profiles_public SET (security_invoker = true);
ALTER VIEW public.order_book SET (security_invoker = true);

-- 3) Restrict mm_inventory reads to authenticated users
DROP POLICY IF EXISTS "MM inventory public read" ON public.mm_inventory;
CREATE POLICY "MM inventory authenticated read"
  ON public.mm_inventory
  FOR SELECT
  TO authenticated
  USING (true);
REVOKE SELECT ON public.mm_inventory FROM anon;

-- 4) Remove orders and positions from realtime publication
ALTER PUBLICATION supabase_realtime DROP TABLE public.orders;
ALTER PUBLICATION supabase_realtime DROP TABLE public.positions;
