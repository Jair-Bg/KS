
-- Add engine column to markets
ALTER TABLE public.markets ADD COLUMN IF NOT EXISTS engine text NOT NULL DEFAULT 'amm';
ALTER TABLE public.markets ADD CONSTRAINT markets_engine_chk CHECK (engine IN ('amm','clob'));

-- ============ ORDERS ============
CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  market_id uuid NOT NULL REFERENCES public.markets(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  side text NOT NULL CHECK (side IN ('BUY','SELL')),
  contract text NOT NULL CHECK (contract IN ('YES','NO')),
  price numeric NOT NULL CHECK (price > 0 AND price < 1),
  quantity numeric NOT NULL CHECK (quantity > 0),
  filled numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','filled','cancelled')),
  is_mm boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_orders_book ON public.orders(market_id, contract, side, price, created_at) WHERE status = 'open';
CREATE INDEX idx_orders_user ON public.orders(user_id, created_at DESC);

GRANT SELECT ON public.orders TO anon;
GRANT SELECT, INSERT, UPDATE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Orders are public for book depth" ON public.orders FOR SELECT USING (true);
CREATE POLICY "Users insert own orders" ON public.orders FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own orders" ON public.orders FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER trg_orders_updated BEFORE UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ POSITIONS ============
CREATE TABLE public.positions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  market_id uuid NOT NULL REFERENCES public.markets(id) ON DELETE CASCADE,
  yes_qty numeric NOT NULL DEFAULT 0,
  no_qty numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, market_id)
);

GRANT SELECT, INSERT, UPDATE ON public.positions TO authenticated;
GRANT ALL ON public.positions TO service_role;

ALTER TABLE public.positions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own positions" ON public.positions FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER trg_positions_updated BEFORE UPDATE ON public.positions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ MM_INVENTORY ============
CREATE TABLE public.mm_inventory (
  market_id uuid PRIMARY KEY REFERENCES public.markets(id) ON DELETE CASCADE,
  yes_qty numeric NOT NULL DEFAULT 0,
  no_qty numeric NOT NULL DEFAULT 0,
  target_notional numeric NOT NULL DEFAULT 1000,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.mm_inventory TO anon, authenticated;
GRANT ALL ON public.mm_inventory TO service_role;

ALTER TABLE public.mm_inventory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "MM inventory public read" ON public.mm_inventory FOR SELECT USING (true);

-- ============ TRADES ============
CREATE TABLE public.trades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  market_id uuid NOT NULL REFERENCES public.markets(id) ON DELETE CASCADE,
  buy_order_id uuid,
  sell_order_id uuid,
  yes_buy_order_id uuid,
  no_buy_order_id uuid,
  contract text,
  price numeric NOT NULL,
  quantity numeric NOT NULL,
  mint boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_trades_market ON public.trades(market_id, created_at DESC);

GRANT SELECT ON public.trades TO anon, authenticated;
GRANT ALL ON public.trades TO service_role;

ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Trades public read" ON public.trades FOR SELECT USING (true);

-- ============ REALTIME ============
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.trades;
ALTER PUBLICATION supabase_realtime ADD TABLE public.positions;

-- ============ HELPER: adjust position ============
CREATE OR REPLACE FUNCTION public.adjust_position(p_user uuid, p_market uuid, p_yes numeric, p_no numeric)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.positions (user_id, market_id, yes_qty, no_qty)
  VALUES (p_user, p_market, p_yes, p_no)
  ON CONFLICT (user_id, market_id) DO UPDATE
    SET yes_qty = public.positions.yes_qty + EXCLUDED.yes_qty,
        no_qty  = public.positions.no_qty  + EXCLUDED.no_qty,
        updated_at = now();
END;
$$;

-- ============ MATCHING ENGINE ============
CREATE OR REPLACE FUNCTION public.match_orders(p_market_id uuid)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_buy RECORD;
  v_sell RECORD;
  v_buy_yes RECORD;
  v_buy_no RECORD;
  v_qty numeric;
  v_price numeric;
  v_mid numeric;
  v_fills int := 0;
  v_refund numeric;
BEGIN
  -- Loop until nothing crosses
  LOOP
    -- 1) DIRECT CROSS: for each contract side, best BUY vs best SELL
    v_buy := NULL; v_sell := NULL;
    SELECT * INTO v_buy FROM public.orders
      WHERE market_id=p_market_id AND status='open' AND side='BUY' AND contract='YES'
      ORDER BY price DESC, created_at ASC LIMIT 1;
    SELECT * INTO v_sell FROM public.orders
      WHERE market_id=p_market_id AND status='open' AND side='SELL' AND contract='YES'
      ORDER BY price ASC, created_at ASC LIMIT 1;

    IF v_buy.id IS NOT NULL AND v_sell.id IS NOT NULL AND v_buy.price >= v_sell.price THEN
      v_qty := LEAST(v_buy.quantity - v_buy.filled, v_sell.quantity - v_sell.filled);
      v_price := v_sell.price; -- maker price
      -- Move YES from seller to buyer
      PERFORM public.adjust_position(v_sell.user_id, p_market_id, -v_qty, 0);
      PERFORM public.adjust_position(v_buy.user_id, p_market_id,  v_qty, 0);
      -- Buyer paid v_buy.price locked; refund overage
      v_refund := (v_buy.price - v_price) * v_qty;
      IF v_refund > 0 THEN
        UPDATE public.profiles SET balance = balance + v_refund WHERE user_id = v_buy.user_id;
      END IF;
      -- Seller receives price*qty
      UPDATE public.profiles SET balance = balance + v_price * v_qty WHERE user_id = v_sell.user_id;

      UPDATE public.orders SET filled = filled + v_qty,
        status = CASE WHEN filled + v_qty >= quantity THEN 'filled' ELSE 'open' END
        WHERE id = v_buy.id;
      UPDATE public.orders SET filled = filled + v_qty,
        status = CASE WHEN filled + v_qty >= quantity THEN 'filled' ELSE 'open' END
        WHERE id = v_sell.id;

      INSERT INTO public.trades(market_id, buy_order_id, sell_order_id, contract, price, quantity, mint)
      VALUES (p_market_id, v_buy.id, v_sell.id, 'YES', v_price, v_qty, false);
      v_fills := v_fills + 1;
      CONTINUE;
    END IF;

    -- Same for NO
    v_buy := NULL; v_sell := NULL;
    SELECT * INTO v_buy FROM public.orders
      WHERE market_id=p_market_id AND status='open' AND side='BUY' AND contract='NO'
      ORDER BY price DESC, created_at ASC LIMIT 1;
    SELECT * INTO v_sell FROM public.orders
      WHERE market_id=p_market_id AND status='open' AND side='SELL' AND contract='NO'
      ORDER BY price ASC, created_at ASC LIMIT 1;

    IF v_buy.id IS NOT NULL AND v_sell.id IS NOT NULL AND v_buy.price >= v_sell.price THEN
      v_qty := LEAST(v_buy.quantity - v_buy.filled, v_sell.quantity - v_sell.filled);
      v_price := v_sell.price;
      PERFORM public.adjust_position(v_sell.user_id, p_market_id, 0, -v_qty);
      PERFORM public.adjust_position(v_buy.user_id, p_market_id, 0, v_qty);
      v_refund := (v_buy.price - v_price) * v_qty;
      IF v_refund > 0 THEN
        UPDATE public.profiles SET balance = balance + v_refund WHERE user_id = v_buy.user_id;
      END IF;
      UPDATE public.profiles SET balance = balance + v_price * v_qty WHERE user_id = v_sell.user_id;

      UPDATE public.orders SET filled = filled + v_qty,
        status = CASE WHEN filled + v_qty >= quantity THEN 'filled' ELSE 'open' END
        WHERE id = v_buy.id;
      UPDATE public.orders SET filled = filled + v_qty,
        status = CASE WHEN filled + v_qty >= quantity THEN 'filled' ELSE 'open' END
        WHERE id = v_sell.id;

      INSERT INTO public.trades(market_id, buy_order_id, sell_order_id, contract, price, quantity, mint)
      VALUES (p_market_id, v_buy.id, v_sell.id, 'NO', v_price, v_qty, false);
      v_fills := v_fills + 1;
      CONTINUE;
    END IF;

    -- 2) COMPLEMENTARY MINT: BUY YES + BUY NO where pY + pN >= 1
    v_buy_yes := NULL; v_buy_no := NULL;
    SELECT * INTO v_buy_yes FROM public.orders
      WHERE market_id=p_market_id AND status='open' AND side='BUY' AND contract='YES'
      ORDER BY price DESC, created_at ASC LIMIT 1;
    SELECT * INTO v_buy_no FROM public.orders
      WHERE market_id=p_market_id AND status='open' AND side='BUY' AND contract='NO'
      ORDER BY price DESC, created_at ASC LIMIT 1;

    IF v_buy_yes.id IS NOT NULL AND v_buy_no.id IS NOT NULL
       AND (v_buy_yes.price + v_buy_no.price) >= 1.0 THEN
      v_qty := LEAST(v_buy_yes.quantity - v_buy_yes.filled, v_buy_no.quantity - v_buy_no.filled);
      -- Mint: each buyer already paid their limit price into escrow; total paid = (pY + pN)*qty
      -- Collateral needed = 1.00 * qty. Overage refunded to each proportionally? Refund each buyer their overage share:
      -- If pY + pN > 1, refund (pY + pN - 1) * qty; split equally
      v_refund := ((v_buy_yes.price + v_buy_no.price) - 1.0) * v_qty;
      IF v_refund > 0 THEN
        UPDATE public.profiles SET balance = balance + v_refund/2 WHERE user_id = v_buy_yes.user_id;
        UPDATE public.profiles SET balance = balance + v_refund/2 WHERE user_id = v_buy_no.user_id;
      END IF;
      PERFORM public.adjust_position(v_buy_yes.user_id, p_market_id, v_qty, 0);
      PERFORM public.adjust_position(v_buy_no.user_id, p_market_id, 0, v_qty);

      UPDATE public.orders SET filled = filled + v_qty,
        status = CASE WHEN filled + v_qty >= quantity THEN 'filled' ELSE 'open' END
        WHERE id = v_buy_yes.id;
      UPDATE public.orders SET filled = filled + v_qty,
        status = CASE WHEN filled + v_qty >= quantity THEN 'filled' ELSE 'open' END
        WHERE id = v_buy_no.id;

      INSERT INTO public.trades(market_id, yes_buy_order_id, no_buy_order_id, price, quantity, mint)
      VALUES (p_market_id, v_buy_yes.id, v_buy_no.id, 1.0, v_qty, true);
      v_fills := v_fills + 1;
      CONTINUE;
    END IF;

    EXIT; -- nothing crossed
  END LOOP;

  -- Update market mid from best bid/ask on YES
  SELECT (
    (COALESCE((SELECT price FROM public.orders WHERE market_id=p_market_id AND status='open' AND side='BUY' AND contract='YES' ORDER BY price DESC LIMIT 1), 0.5)
   + COALESCE((SELECT price FROM public.orders WHERE market_id=p_market_id AND status='open' AND side='SELL' AND contract='YES' ORDER BY price ASC LIMIT 1), 0.5)
    ) / 2.0
  ) INTO v_mid;
  IF v_mid IS NOT NULL THEN
    UPDATE public.markets
      SET yes_odds = ROUND(v_mid * 100), no_odds = ROUND((1 - v_mid) * 100)
      WHERE id = p_market_id AND engine = 'clob';
    INSERT INTO public.odds_history(market_id, yes_odds, no_odds)
    VALUES (p_market_id, ROUND(v_mid * 100), ROUND((1 - v_mid) * 100));
  END IF;

  RETURN v_fills;
END;
$$;

-- ============ PLACE LIMIT ORDER ============
CREATE OR REPLACE FUNCTION public.place_limit_order(
  p_market_id uuid, p_side text, p_contract text, p_price numeric, p_quantity numeric, p_is_mm boolean DEFAULT false
) RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_cost numeric;
  v_order_id uuid;
  v_profile RECORD;
  v_market RECORD;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF p_price <= 0 OR p_price >= 1 THEN RAISE EXCEPTION 'Price must be between 0 and 1'; END IF;
  IF p_quantity <= 0 THEN RAISE EXCEPTION 'Quantity must be positive'; END IF;

  SELECT * INTO v_market FROM public.markets WHERE id = p_market_id FOR UPDATE;
  IF NOT FOUND OR v_market.status <> 'active' THEN RAISE EXCEPTION 'Market not active'; END IF;
  IF v_market.engine <> 'clob' THEN RAISE EXCEPTION 'Market does not use CLOB engine'; END IF;

  SELECT * INTO v_profile FROM public.profiles WHERE user_id = v_uid FOR UPDATE;

  IF upper(p_side) = 'BUY' THEN
    v_cost := p_price * p_quantity;
    IF v_profile.balance < v_cost THEN RAISE EXCEPTION 'Insufficient balance'; END IF;
    UPDATE public.profiles SET balance = balance - v_cost WHERE user_id = v_uid;
  ELSE
    -- SELL: require position of that contract
    DECLARE v_pos RECORD;
    BEGIN
      SELECT * INTO v_pos FROM public.positions WHERE user_id = v_uid AND market_id = p_market_id;
      IF NOT FOUND THEN RAISE EXCEPTION 'No position to sell'; END IF;
      IF upper(p_contract) = 'YES' AND v_pos.yes_qty < p_quantity THEN RAISE EXCEPTION 'Insufficient YES'; END IF;
      IF upper(p_contract) = 'NO' AND v_pos.no_qty < p_quantity THEN RAISE EXCEPTION 'Insufficient NO'; END IF;
    END;
  END IF;

  INSERT INTO public.orders (market_id, user_id, side, contract, price, quantity, is_mm)
  VALUES (p_market_id, v_uid, upper(p_side), upper(p_contract), p_price, p_quantity, p_is_mm)
  RETURNING id INTO v_order_id;

  PERFORM public.match_orders(p_market_id);

  RETURN json_build_object('order_id', v_order_id);
END;
$$;

-- ============ CANCEL ORDER ============
CREATE OR REPLACE FUNCTION public.cancel_order(p_order_id uuid)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_order RECORD;
  v_remaining numeric;
  v_refund numeric;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Order not found'; END IF;
  IF v_order.user_id <> v_uid THEN RAISE EXCEPTION 'Not your order'; END IF;
  IF v_order.status <> 'open' THEN RAISE EXCEPTION 'Order not open'; END IF;

  v_remaining := v_order.quantity - v_order.filled;
  IF v_order.side = 'BUY' THEN
    v_refund := v_remaining * v_order.price;
    UPDATE public.profiles SET balance = balance + v_refund WHERE user_id = v_uid;
  END IF;
  UPDATE public.orders SET status = 'cancelled' WHERE id = p_order_id;
  RETURN json_build_object('cancelled', p_order_id, 'refund', COALESCE(v_refund, 0));
END;
$$;

-- ============ MM GENERATE QUOTES ============
CREATE OR REPLACE FUNCTION public.mm_generate_quotes(
  p_market_id uuid, p_model numeric, p_confidence text DEFAULT 'high', p_quantity numeric DEFAULT 1000
) RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_market RECORD;
  v_inv RECORD;
  v_spread numeric;
  v_skew numeric := 0;
  v_mid numeric;
  v_bid_yes numeric; v_ask_yes numeric;
  v_bid_no  numeric; v_ask_no  numeric;
  v_orders json;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT * INTO v_market FROM public.markets WHERE id = p_market_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Market not found'; END IF;
  IF v_market.creator_id <> v_uid AND NOT public.has_role(v_uid, 'admin') THEN
    RAISE EXCEPTION 'Only market creator can run MM';
  END IF;
  IF v_market.engine <> 'clob' THEN RAISE EXCEPTION 'Market is not CLOB'; END IF;
  IF p_model <= 0 OR p_model >= 1 THEN RAISE EXCEPTION 'p_model must be in (0,1)'; END IF;

  v_spread := CASE WHEN lower(p_confidence) = 'high' THEN 0.01 ELSE 0.03 END;

  -- Ensure inventory row exists
  INSERT INTO public.mm_inventory(market_id) VALUES (p_market_id)
  ON CONFLICT (market_id) DO NOTHING;
  SELECT * INTO v_inv FROM public.mm_inventory WHERE market_id = p_market_id;

  -- Skew: long YES => lower prices to sell YES / discourage more YES buys
  v_skew := GREATEST(-1, LEAST(1,
    (v_inv.yes_qty - v_inv.no_qty) / GREATEST(v_inv.target_notional, 1)
  )) * 0.02;

  v_mid     := ROUND((p_model - v_skew)::numeric, 2);
  v_bid_yes := GREATEST(0.01, LEAST(0.99, ROUND((v_mid - v_spread)::numeric, 2)));
  v_ask_yes := GREATEST(0.01, LEAST(0.99, ROUND((v_mid + v_spread)::numeric, 2)));
  v_bid_no  := GREATEST(0.01, LEAST(0.99, ROUND((1 - v_mid - v_spread)::numeric, 2)));
  v_ask_no  := GREATEST(0.01, LEAST(0.99, ROUND((1 - v_mid + v_spread)::numeric, 2)));

  -- Fire the 4 orders (skip SELL if no inventory)
  PERFORM public.place_limit_order(p_market_id, 'BUY', 'YES', v_bid_yes, p_quantity, true);
  IF v_inv.yes_qty >= p_quantity THEN
    PERFORM public.place_limit_order(p_market_id, 'SELL', 'YES', v_ask_yes, p_quantity, true);
  END IF;
  PERFORM public.place_limit_order(p_market_id, 'BUY', 'NO', v_bid_no, p_quantity, true);
  IF v_inv.no_qty >= p_quantity THEN
    PERFORM public.place_limit_order(p_market_id, 'SELL', 'NO', v_ask_no, p_quantity, true);
  END IF;

  v_orders := json_build_array(
    json_build_object('side','BUY','contract','YES','order_type','LIMIT','price',v_bid_yes,'quantity_contracts',p_quantity),
    json_build_object('side','SELL','contract','YES','order_type','LIMIT','price',v_ask_yes,'quantity_contracts',p_quantity),
    json_build_object('side','BUY','contract','NO','order_type','LIMIT','price',v_bid_no,'quantity_contracts',p_quantity),
    json_build_object('side','SELL','contract','NO','order_type','LIMIT','price',v_ask_no,'quantity_contracts',p_quantity)
  );

  RETURN json_build_object(
    'event_id', p_market_id::text,
    'timestamp', extract(epoch from now())::bigint,
    'mid', v_mid,
    'spread', v_spread,
    'skew', v_skew,
    'market_maker_orders', v_orders
  );
END;
$$;
