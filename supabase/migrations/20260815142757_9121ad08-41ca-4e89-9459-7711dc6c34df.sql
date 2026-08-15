CREATE OR REPLACE FUNCTION public.claim_creator_role()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_existing boolean;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = v_uid AND role = 'creator'
  ) INTO v_existing;

  IF v_existing THEN
    RETURN json_build_object('granted', false, 'already_creator', true);
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_uid, 'creator')
  ON CONFLICT DO NOTHING;

  INSERT INTO public.admin_audit_log (actor_id, action, target_user_id, details)
  VALUES (v_uid, 'creator_signup', v_uid, jsonb_build_object('source', 'creator_signup_flow'));

  RETURN json_build_object('granted', true, 'already_creator', false);
END;
$$;

GRANT EXECUTE ON FUNCTION public.claim_creator_role() TO authenticated;