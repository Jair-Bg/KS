
REVOKE EXECUTE ON FUNCTION public.place_limit_order(uuid,text,text,numeric,numeric,boolean) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.cancel_order(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.mm_generate_quotes(uuid,numeric,text,numeric) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.match_orders(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.adjust_position(uuid,uuid,numeric,numeric) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.place_limit_order(uuid,text,text,numeric,numeric,boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_order(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mm_generate_quotes(uuid,numeric,text,numeric) TO authenticated;
