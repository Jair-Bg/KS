import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "cancel_order",
  title: "Cancel order",
  description: "Cancel one of the signed-in user's open limit orders and refund its collateral.",
  inputSchema: { order_id: z.string().uuid().describe("The order id to cancel.") },
  annotations: { readOnlyHint: false, destructiveHint: true, openWorldHint: false },
  handler: async ({ order_id }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const { error } = await supabase.rpc("cancel_order", { p_order_id: order_id });
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: `Order ${order_id} cancelled.` }],
      structuredContent: { order_id, status: "cancelled" },
    };
  },
});
