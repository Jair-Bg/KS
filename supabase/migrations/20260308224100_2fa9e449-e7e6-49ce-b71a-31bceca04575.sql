
-- Market options table for multi-outcome support
CREATE TABLE public.market_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  market_id uuid NOT NULL REFERENCES public.markets(id) ON DELETE CASCADE,
  name text NOT NULL,
  odds numeric NOT NULL DEFAULT 50,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_market_options_market ON public.market_options(market_id);

ALTER TABLE public.market_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Market options are viewable by everyone"
  ON public.market_options FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create market options"
  ON public.market_options FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Market creators can update options"
  ON public.market_options FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.markets WHERE markets.id = market_options.market_id AND markets.creator_id = auth.uid()));

-- Odds history table for charts
CREATE TABLE public.odds_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  market_id uuid NOT NULL REFERENCES public.markets(id) ON DELETE CASCADE,
  option_id uuid REFERENCES public.market_options(id) ON DELETE CASCADE,
  option_name text NOT NULL,
  odds numeric NOT NULL,
  volume_at_time numeric NOT NULL DEFAULT 0,
  recorded_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_odds_history_market ON public.odds_history(market_id, recorded_at);

ALTER TABLE public.odds_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Odds history is viewable by everyone"
  ON public.odds_history FOR SELECT
  USING (true);

-- Allow inserts from service role (via functions)
CREATE POLICY "System can insert odds history"
  ON public.odds_history FOR INSERT
  WITH CHECK (true);

-- Update bets table to reference option_id
ALTER TABLE public.bets ADD COLUMN option_id uuid REFERENCES public.market_options(id) ON DELETE SET NULL;

-- Enable realtime for options
ALTER PUBLICATION supabase_realtime ADD TABLE public.market_options;

-- Replace place_bet function with multi-outcome support
CREATE OR REPLACE FUNCTION public.place_bet(
  p_market_id uuid,
  p_user_id uuid,
  p_option text,
  p_amount numeric
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_market markets%ROWTYPE;
  v_option market_options%ROWTYPE;
  v_odds numeric;
  v_payout numeric;
  v_bet_id uuid;
  v_balance numeric;
  v_option_count integer;
  v_total_odds numeric;
  rec RECORD;
BEGIN
  -- Get market
  SELECT * INTO v_market FROM markets WHERE id = p_market_id AND status = 'active';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Market not found or not active';
  END IF;

  -- Check user balance
  SELECT balance INTO v_balance FROM profiles WHERE user_id = p_user_id;
  IF v_balance IS NULL OR v_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;

  -- Check if multi-outcome market (has market_options)
  SELECT COUNT(*) INTO v_option_count FROM market_options WHERE market_id = p_market_id;

  IF v_option_count > 0 THEN
    -- Multi-outcome: find the option
    SELECT * INTO v_option FROM market_options WHERE market_id = p_market_id AND name = p_option;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Invalid option';
    END IF;
    v_odds := v_option.odds;
    v_payout := p_amount * (100.0 / v_odds);

    -- Insert bet
    INSERT INTO bets (market_id, user_id, option, option_id, amount, odds_at_time, potential_payout)
    VALUES (p_market_id, p_user_id, p_option, v_option.id, p_amount, v_odds, v_payout)
    RETURNING id INTO v_bet_id;

    -- Shift odds: increase chosen option, decrease others proportionally
    UPDATE market_options
    SET odds = LEAST(95, odds + GREATEST(0.5, p_amount / 200))
    WHERE id = v_option.id;

    -- Get new total and rebalance
    SELECT SUM(odds) INTO v_total_odds FROM market_options WHERE market_id = p_market_id;
    FOR rec IN SELECT id, odds FROM market_options WHERE market_id = p_market_id LOOP
      UPDATE market_options SET odds = GREATEST(2, ROUND((rec.odds / v_total_odds) * 100, 1)) WHERE id = rec.id;
    END LOOP;

    -- Record odds history for all options
    INSERT INTO odds_history (market_id, option_id, option_name, odds, volume_at_time)
    SELECT p_market_id, mo.id, mo.name, mo.odds, v_market.volume + p_amount
    FROM market_options mo WHERE mo.market_id = p_market_id;

  ELSE
    -- Binary market: use yes_odds/no_odds on market
    IF p_option = 'Yes' THEN
      v_odds := v_market.yes_odds;
    ELSIF p_option = 'No' THEN
      v_odds := v_market.no_odds;
    ELSE
      RAISE EXCEPTION 'Invalid option';
    END IF;

    v_payout := p_amount * (100.0 / v_odds);

    INSERT INTO bets (market_id, user_id, option, amount, odds_at_time, potential_payout)
    VALUES (p_market_id, p_user_id, p_option, p_amount, v_odds, v_payout)
    RETURNING id INTO v_bet_id;

    -- Shift odds
    IF p_option = 'Yes' THEN
      UPDATE markets SET
        yes_odds = LEAST(95, yes_odds + GREATEST(1, p_amount / 100)),
        no_odds = GREATEST(5, 100 - LEAST(95, yes_odds + GREATEST(1, p_amount / 100)))
      WHERE id = p_market_id;
    ELSE
      UPDATE markets SET
        no_odds = LEAST(95, no_odds + GREATEST(1, p_amount / 100)),
        yes_odds = GREATEST(5, 100 - LEAST(95, no_odds + GREATEST(1, p_amount / 100)))
      WHERE id = p_market_id;
    END IF;

    -- Record binary odds history
    INSERT INTO odds_history (market_id, option_name, odds, volume_at_time)
    VALUES (p_market_id, 'Yes', (SELECT yes_odds FROM markets WHERE id = p_market_id), v_market.volume + p_amount);
    INSERT INTO odds_history (market_id, option_name, odds, volume_at_time)
    VALUES (p_market_id, 'No', (SELECT no_odds FROM markets WHERE id = p_market_id), v_market.volume + p_amount);
  END IF;

  -- Deduct balance and update market volume
  UPDATE profiles SET balance = balance - p_amount, total_bets = COALESCE(total_bets, 0) + 1 WHERE user_id = p_user_id;
  UPDATE markets SET
    volume = volume + p_amount,
    total_traders = (SELECT COUNT(DISTINCT user_id) FROM bets WHERE market_id = p_market_id)
  WHERE id = p_market_id;

  RETURN json_build_object(
    'bet_id', v_bet_id,
    'odds', v_odds,
    'payout', ROUND(v_payout, 2)
  );
END;
$$;
