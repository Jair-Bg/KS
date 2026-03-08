
-- Markets table
CREATE TABLE public.markets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL,
  question text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'trending',
  market_type text NOT NULL DEFAULT 'binary' CHECK (market_type IN ('binary', 'multi')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed', 'resolved', 'cancelled')),
  resolution text CHECK (resolution IN ('yes', 'no', NULL)),
  yes_odds numeric NOT NULL DEFAULT 50,
  no_odds numeric NOT NULL DEFAULT 50,
  volume numeric NOT NULL DEFAULT 0,
  total_traders integer NOT NULL DEFAULT 0,
  embed_views integer NOT NULL DEFAULT 0,
  end_date timestamp with time zone NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Bets table
CREATE TABLE public.bets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  market_id uuid NOT NULL REFERENCES public.markets(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  option text NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0),
  odds_at_time numeric NOT NULL,
  potential_payout numeric NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'won', 'lost', 'cancelled')),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_markets_category ON public.markets(category);
CREATE INDEX idx_markets_status ON public.markets(status);
CREATE INDEX idx_markets_creator ON public.markets(creator_id);
CREATE INDEX idx_bets_market ON public.bets(market_id);
CREATE INDEX idx_bets_user ON public.bets(user_id);

-- Enable RLS
ALTER TABLE public.markets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bets ENABLE ROW LEVEL SECURITY;

-- Markets RLS: anyone can read active markets (for embeds)
CREATE POLICY "Markets are viewable by everyone"
  ON public.markets FOR SELECT
  USING (true);

-- Markets RLS: authenticated users can create
CREATE POLICY "Authenticated users can create markets"
  ON public.markets FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = creator_id);

-- Markets RLS: creators can update their own markets
CREATE POLICY "Creators can update own markets"
  ON public.markets FOR UPDATE
  TO authenticated
  USING (auth.uid() = creator_id);

-- Bets RLS: users can see their own bets
CREATE POLICY "Users can view own bets"
  ON public.bets FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Bets RLS: authenticated users can place bets
CREATE POLICY "Authenticated users can place bets"
  ON public.bets FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Bets RLS: public can see aggregate bet counts per market (for embed display)
CREATE POLICY "Anyone can view bets for market stats"
  ON public.bets FOR SELECT
  USING (true);

-- Update trigger for markets
CREATE TRIGGER update_markets_updated_at
  BEFORE UPDATE ON public.markets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for markets
ALTER PUBLICATION supabase_realtime ADD TABLE public.markets;

-- Function to place a bet and update market odds atomically
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
  v_odds numeric;
  v_payout numeric;
  v_bet_id uuid;
  v_new_yes_odds numeric;
  v_new_no_odds numeric;
  v_balance numeric;
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

  -- Calculate odds
  IF p_option = 'Yes' THEN
    v_odds := v_market.yes_odds;
  ELSIF p_option = 'No' THEN
    v_odds := v_market.no_odds;
  ELSE
    RAISE EXCEPTION 'Invalid option';
  END IF;

  v_payout := p_amount * (100.0 / v_odds);

  -- Insert bet
  INSERT INTO bets (market_id, user_id, option, amount, odds_at_time, potential_payout)
  VALUES (p_market_id, p_user_id, p_option, p_amount, v_odds, v_payout)
  RETURNING id INTO v_bet_id;

  -- Deduct balance
  UPDATE profiles SET balance = balance - p_amount, total_bets = COALESCE(total_bets, 0) + 1 WHERE user_id = p_user_id;

  -- Shift odds based on bet (simple model: bet moves odds toward the chosen option)
  IF p_option = 'Yes' THEN
    v_new_yes_odds := LEAST(95, v_market.yes_odds + GREATEST(1, p_amount / 100));
    v_new_no_odds := 100 - v_new_yes_odds;
  ELSE
    v_new_no_odds := LEAST(95, v_market.no_odds + GREATEST(1, p_amount / 100));
    v_new_yes_odds := 100 - v_new_no_odds;
  END IF;

  -- Update market
  UPDATE markets
  SET yes_odds = v_new_yes_odds,
      no_odds = v_new_no_odds,
      volume = volume + p_amount,
      total_traders = (SELECT COUNT(DISTINCT user_id) FROM bets WHERE market_id = p_market_id)
  WHERE id = p_market_id;

  RETURN json_build_object(
    'bet_id', v_bet_id,
    'odds', v_odds,
    'payout', ROUND(v_payout, 2),
    'new_yes_odds', v_new_yes_odds,
    'new_no_odds', v_new_no_odds
  );
END;
$$;
