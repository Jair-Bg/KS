-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  balance NUMERIC NOT NULL DEFAULT 1000,
  total_bets INTEGER NOT NULL DEFAULT 0,
  total_winnings NUMERIC NOT NULL DEFAULT 0,
  created_markets INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view basic profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Markets
CREATE TABLE public.markets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'trending',
  market_type TEXT NOT NULL DEFAULT 'binary',
  status TEXT NOT NULL DEFAULT 'active',
  resolution TEXT,
  yes_odds NUMERIC NOT NULL DEFAULT 50,
  no_odds NUMERIC NOT NULL DEFAULT 50,
  volume NUMERIC NOT NULL DEFAULT 0,
  total_traders INTEGER NOT NULL DEFAULT 0,
  embed_views INTEGER NOT NULL DEFAULT 0,
  end_date TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.markets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view markets" ON public.markets FOR SELECT USING (true);
CREATE POLICY "Auth users create markets" ON public.markets FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Creators update own markets" ON public.markets FOR UPDATE USING (auth.uid() = creator_id);
CREATE POLICY "Creators delete own markets" ON public.markets FOR DELETE USING (auth.uid() = creator_id);

CREATE TRIGGER markets_updated_at BEFORE UPDATE ON public.markets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_markets_category ON public.markets(category);
CREATE INDEX idx_markets_status ON public.markets(status);
CREATE INDEX idx_markets_volume ON public.markets(volume DESC);
CREATE INDEX idx_markets_creator ON public.markets(creator_id);

-- Market options (for multi-outcome markets)
CREATE TABLE public.market_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  market_id UUID NOT NULL REFERENCES public.markets(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  odds NUMERIC NOT NULL DEFAULT 50,
  sort_order INTEGER NOT NULL DEFAULT 0
);
ALTER TABLE public.market_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view market options" ON public.market_options FOR SELECT USING (true);
CREATE POLICY "Market creator manages options" ON public.market_options FOR ALL
  USING (EXISTS (SELECT 1 FROM public.markets m WHERE m.id = market_id AND m.creator_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.markets m WHERE m.id = market_id AND m.creator_id = auth.uid()));

-- Bets
CREATE TABLE public.bets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  market_id UUID NOT NULL REFERENCES public.markets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  option TEXT NOT NULL,
  option_id UUID REFERENCES public.market_options(id) ON DELETE SET NULL,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  odds_at_time NUMERIC NOT NULL,
  potential_payout NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.bets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own bets" ON public.bets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users place own bets" ON public.bets FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_bets_user ON public.bets(user_id);
CREATE INDEX idx_bets_market ON public.bets(market_id);

-- Odds history
CREATE TABLE public.odds_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  market_id UUID NOT NULL REFERENCES public.markets(id) ON DELETE CASCADE,
  yes_odds NUMERIC NOT NULL,
  no_odds NUMERIC NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.odds_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view odds history" ON public.odds_history FOR SELECT USING (true);

CREATE INDEX idx_odds_history_market ON public.odds_history(market_id, recorded_at DESC);

-- place_bet RPC: atomic bet placement that nudges odds
CREATE OR REPLACE FUNCTION public.place_bet(
  p_market_id UUID,
  p_user_id UUID,
  p_option TEXT,
  p_amount NUMERIC
) RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
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

  -- Simple AMM-style odds nudge proportional to bet vs volume
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
$$;