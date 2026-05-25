
REVOKE EXECUTE ON FUNCTION public.resolve_market(uuid, text) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.auto_resolve_expired_markets() FROM anon, authenticated, public;
