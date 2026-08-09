CREATE TABLE public.mcp_tool_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL DEFAULT auth.uid(),
  tool_name text NOT NULL,
  client_id text,
  arguments jsonb NOT NULL DEFAULT '{}'::jsonb,
  success boolean NOT NULL DEFAULT true,
  error_message text,
  duration_ms integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.mcp_tool_logs TO authenticated;
GRANT ALL ON public.mcp_tool_logs TO service_role;

ALTER TABLE public.mcp_tool_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users insert own mcp logs"
ON public.mcp_tool_logs FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users read own mcp logs"
ON public.mcp_tool_logs FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE INDEX mcp_tool_logs_created_at_idx ON public.mcp_tool_logs (created_at DESC);
CREATE INDEX mcp_tool_logs_user_idx ON public.mcp_tool_logs (user_id, created_at DESC);