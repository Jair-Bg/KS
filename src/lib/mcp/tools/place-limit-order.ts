import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";
import { withLogging } from "../logging";

export default defineTool({
  name: "place_limit_order",
  title: "Place limit order",
  description:
    "Place a resting limit order on a CLOB market as the signed-in user (BUY/SELL of a YES or NO contract at a price between 0.01 and 0.99).",
  inputSchema: {
    market_id: z.string().uuid().describe("CLOB market id."),
    side: z.enum(["BUY", "SELL"]).describe("Order side."),
    contract: z.enum(["YES", "NO"]).describe("Contract to trade."),
    price: z.number().min(0.01).max(0.99).describe("Limit price in dollars per contract."),
    quantity: z.number().positive().max(100000).describe("Number of contracts."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: withLogging("place_limit_order", async ({ market_id, side, contract, price, quantity }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase.rpc("place_limit_order", {
      p_market_id: market_id,
      p_side: side,
      p_contract: contract,
      p_price: price,
      p_quantity: quantity,
    });
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data) }],
      structuredContent: { result: data },
    };
  }),
});
