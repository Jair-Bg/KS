
CREATE TABLE public.admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid NOT NULL,
  action text NOT NULL,
  target_user_id uuid,
  target_market_id uuid,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.admin_audit_log TO authenticated;
GRANT ALL ON public.admin_audit_log TO service_role;

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit log"
ON public.admin_audit_log FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX admin_audit_log_created_at_idx ON public.admin_audit_log (created_at DESC);

-- Update admin_set_role to log
CREATE OR REPLACE FUNCTION public.admin_set_role(p_user_id uuid, p_role app_role, p_grant boolean)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Admin only'; END IF;
  IF p_grant THEN
    INSERT INTO public.user_roles(user_id, role) VALUES (p_user_id, p_role)
    ON CONFLICT DO NOTHING;
  ELSE
    IF p_role = 'admin' AND (SELECT count(*) FROM public.user_roles WHERE role='admin') <= 1 THEN
      RAISE EXCEPTION 'Cannot remove the last admin';
    END IF;
    DELETE FROM public.user_roles WHERE user_id = p_user_id AND role = p_role;
  END IF;
  INSERT INTO public.admin_audit_log(actor_id, action, target_user_id, details)
  VALUES (auth.uid(), CASE WHEN p_grant THEN 'grant_role' ELSE 'revoke_role' END,
          p_user_id, jsonb_build_object('role', p_role::text));
  RETURN json_build_object('ok', true);
END;$function$;

-- Update admin_force_resolve to log
CREATE OR REPLACE FUNCTION public.admin_force_resolve(p_market_id uuid, p_outcome text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_res json;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Admin only'; END IF;
  v_res := public.resolve_market(p_market_id, p_outcome);
  INSERT INTO public.admin_audit_log(actor_id, action, target_market_id, details)
  VALUES (auth.uid(), 'force_resolve', p_market_id, jsonb_build_object('outcome', p_outcome, 'result', v_res));
  RETURN v_res;
END;$function$;

-- Listing function with names joined in
CREATE OR REPLACE FUNCTION public.admin_list_audit(p_limit integer DEFAULT 200)
 RETURNS TABLE(
   id uuid, created_at timestamptz, action text,
   actor_id uuid, actor_name text,
   target_user_id uuid, target_user_name text,
   target_market_id uuid, target_market_question text,
   details jsonb
 )
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Admin only'; END IF;
  RETURN QUERY
  SELECT a.id, a.created_at, a.action,
    a.actor_id, pa.display_name,
    a.target_user_id, pt.display_name,
    a.target_market_id, m.question,
    a.details
  FROM public.admin_audit_log a
  LEFT JOIN public.profiles pa ON pa.user_id = a.actor_id
  LEFT JOIN public.profiles pt ON pt.user_id = a.target_user_id
  LEFT JOIN public.markets m ON m.id = a.target_market_id
  ORDER BY a.created_at DESC
  LIMIT p_limit;
END;$function$;
