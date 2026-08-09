import type { ToolContext } from "@lovable.dev/mcp-js";
import { supabaseForUser } from "./supabase";

type ToolResult = {
  content: Array<{ type: "text"; text: string }>;
  structuredContent?: Record<string, unknown>;
  isError?: boolean;
};

/**
 * Wraps an MCP tool handler so every invocation is recorded in `mcp_tool_logs`
 * (tool name, arguments, success, error message, latency, agent client id).
 * Logging never fails the tool call.
 */
export function withLogging<Input extends Record<string, unknown>>(
  toolName: string,
  handler: (input: Input, ctx: ToolContext) => Promise<ToolResult> | ToolResult,
) {
  return async (input: Input, ctx: ToolContext): Promise<ToolResult> => {
    const startedAt = Date.now();
    let result: ToolResult;
    let thrown: unknown = null;
    try {
      result = await handler(input, ctx);
    } catch (err) {
      thrown = err;
      result = {
        content: [{ type: "text", text: err instanceof Error ? err.message : "Tool failed" }],
        isError: true,
      };
    }

    const durationMs = Date.now() - startedAt;
    const success = !thrown && !result.isError;
    const errorMessage = success
      ? null
      : thrown instanceof Error
        ? thrown.message
        : (result.content?.[0]?.text ?? "Unknown error");

    try {
      if (ctx.isAuthenticated?.()) {
        await supabaseForUser(ctx).from("mcp_tool_logs").insert({
          user_id: ctx.getUserId(),
          tool_name: toolName,
          client_id: ctx.getClientId?.() ?? null,
          arguments: (input ?? {}) as Record<string, unknown>,
          success,
          error_message: errorMessage,
          duration_ms: durationMs,
        });
      }
    } catch {
      // Never let logging break a tool call.
    }

    return result;
  };
}
