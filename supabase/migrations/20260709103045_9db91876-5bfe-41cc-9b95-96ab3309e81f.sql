
-- Admin: platform stats
CREATE OR REPLACE FUNCTION public.admin_get_stats()
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v json;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Admin only'; END IF;
  SELECT json_build_object(
    'total_users', (SELECT count(*) FROM public.profiles),
    'total_markets', (SELECT count(*) FROM public.markets),
    'active_markets', (SELECT count(*) FROM public.markets WHERE status='active'),
    'resolved_markets', (SELECT count(*) FROM public.markets WHERE status='resolved'),
    'total_bets', (SELECT count(*) FROM public.bets),
    'total_volume', (SELECT COALESCE(sum(volume),0) FROM public.markets),
    'total_orders', (SELECT count(*) FROM public.orders),
    'open_orders', (SELECT count(*) FROM public.orders WHERE status='open'),
    'total_trades', (SELECT count(*) FROM public.trades),
    'total_balance', (SELECT COALESCE(sum(balance),0) FROM public.profiles)
  ) INTO v;
  RETURN v;
END;$$;

-- Admin: list users
CREATE OR REPLACE FUNCTION public.admin_list_users(p_limit int DEFAULT 200)
RETURNS TABLE(
  user_id uuid, display_name text, balance numeric, total_bets int,
  total_winnings numeric, created_markets int, roles text[], created_at timestamptz
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Admin only'; END IF;
  RETURN QUERY
  SELECT p.user_id, p.display_name, p.balance, p.total_bets, p.total_winnings, p.created_markets,
    COALESCE((SELECT array_agg(r.role::text) FROM public.user_roles r WHERE r.user_id = p.user_id), ARRAY[]::text[]),
    p.created_at
  FROM public.profiles p
  ORDER BY p.created_at DESC
  LIMIT p_limit;
END;$$;

-- Admin: set role (grant or revoke)
CREATE OR REPLACE FUNCTION public.admin_set_role(p_user_id uuid, p_role public.app_role, p_grant boolean)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Admin only'; END IF;
  IF p_grant THEN
    INSERT INTO public.user_roles(user_id, role) VALUES (p_user_id, p_role)
    ON CONFLICT DO NOTHING;
  ELSE
    -- prevent removing the last admin
    IF p_role = 'admin' AND (SELECT count(*) FROM public.user_roles WHERE role='admin') <= 1 THEN
      RAISE EXCEPTION 'Cannot remove the last admin';
    END IF;
    DELETE FROM public.user_roles WHERE user_id = p_user_id AND role = p_role;
  END IF;
  RETURN json_build_object('ok', true);
END;$$;

-- Admin: force resolve a market
CREATE OR REPLACE FUNCTION public.admin_force_resolve(p_market_id uuid, p_outcome text)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Admin only'; END IF;
  RETURN public.resolve_market(p_market_id, p_outcome);
END;$$;

REVOKE ALL ON FUNCTION public.admin_get_stats() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_list_users(int) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_set_role(uuid, public.app_role, boolean) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_force_resolve(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_get_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_list_users(int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_role(uuid, public.app_role, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_force_resolve(uuid, text) TO authenticated;
