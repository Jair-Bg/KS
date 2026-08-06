import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "get_market",
  title: "Get market",
  description:
    "Get one prediction market by id, including current YES/NO odds, volume, resolution status and recent order book depth.",
  inputSchema: { market_id: z.string().uuid().describe("The market id.") },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ market_id }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const { data: market, error } = await supabase
      .from("markets")
      .select("*")
      .eq("id", market_id)
      .maybeSingle();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    if (!market) return { content: [{ type: "text", text: "Market not found" }], isError: true };

    const { data: book } = await supabase
      .from("order_book")
      .select("side,contract,price,quantity,filled,status")
      .eq("market_id", market_id)
      .eq("status", "open")
      .order("price", { ascending: false })
      .limit(50);

    const payload = { market, order_book: book ?? [] };
    return {
      content: [{ type: "text", text: JSON.stringify(payload) }],
      structuredContent: payload,
    };
  },
});
