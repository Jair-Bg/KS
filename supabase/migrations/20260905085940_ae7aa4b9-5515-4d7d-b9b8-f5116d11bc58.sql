CREATE OR REPLACE FUNCTION public.prevent_profile_financial_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Trusted paths: service_role, or any SECURITY DEFINER routine running as a
  -- privileged owner (place_bet, match_orders, resolve_market, ...). Direct
  -- client updates arrive as the anon/authenticated roles and stay blocked.
  IF auth.role() = 'service_role' OR current_user NOT IN ('anon', 'authenticated') THEN
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
$function$;