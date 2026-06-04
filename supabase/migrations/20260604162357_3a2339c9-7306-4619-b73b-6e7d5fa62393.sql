
-- 1. Profiles: restrict sensitive financial columns
DROP POLICY IF EXISTS "Public can view basic profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users insert own profile" ON public.profiles;

-- Public view exposing only safe columns
CREATE OR REPLACE VIEW public.profiles_public
WITH (security_invoker = true) AS
SELECT id, user_id, display_name, avatar_url, bio, created_at
FROM public.profiles;
GRANT SELECT ON public.profiles_public TO anon, authenticated;

-- Only owners can read their full profile
CREATE POLICY "Users view own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Insert: enforce default financial values
CREATE POLICY "Users insert own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND balance = 1000
  AND total_bets = 0
  AND total_winnings = 0
  AND created_markets = 0
);

-- Prevent users from changing financial columns via trigger
CREATE OR REPLACE FUNCTION public.prevent_profile_financial_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;
  IF NEW.balance IS DISTINCT FROM OLD.balance
     OR NEW.total_bets IS DISTINCT FROM OLD.total_bets
     OR NEW.total_winnings IS DISTINCT FROM OLD.total_winnings
     OR NEW.created_markets IS DISTINCT FROM OLD.created_markets
     OR NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    RAISE EXCEPTION 'Cannot modify financial columns directly';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_profile_financials ON public.profiles;
CREATE TRIGGER protect_profile_financials
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.prevent_profile_financial_update();

CREATE POLICY "Users update own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 2. Lock down SECURITY DEFINER functions not meant to be called by users
REVOKE EXECUTE ON FUNCTION public.resolve_market(uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.auto_resolve_expired_markets() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
-- place_bet must remain callable by authenticated users
REVOKE EXECUTE ON FUNCTION public.place_bet(uuid, uuid, text, numeric) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.place_bet(uuid, uuid, text, numeric) TO authenticated;

-- 3. Realtime: remove bets from public publication (RLS already restricts to own bets;
--    realtime subscriptions to others is not meaningful and the scanner flagged it).
ALTER PUBLICATION supabase_realtime DROP TABLE public.bets;

-- 4. Realtime messages: scope channel subscriptions
ALTER TABLE IF EXISTS realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can read scoped topics" ON realtime.messages;
CREATE POLICY "Authenticated can read scoped topics"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  -- Allow public market/odds topics and a user's own profile topic
  realtime.topic() LIKE 'market-%'
  OR realtime.topic() LIKE 'markets-%'
  OR realtime.topic() LIKE 'odds-%'
  OR realtime.topic() = 'profile-' || auth.uid()::text
);
