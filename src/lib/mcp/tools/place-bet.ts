import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "place_bet",
  title: "Place bet",
  description:
    "Place a bet as the signed-in user on an AMM market outcome (Yes or No) for a given amount of demo balance.",
  inputSchema: {
    market_id: z.string().uuid().describe("The market to bet on."),
    option: z.enum(["Yes", "No"]).describe("Outcome to back."),
    amount: z.number().positive().max(10000).describe("Stake amount in demo balance."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async ({ market_id, option, amount }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase.rpc("place_bet", {
      p_market_id: market_id,
      p_user_id: ctx.getUserId(),
      p_option: option,
      p_amount: amount,
    });
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data) }],
      structuredContent: { result: data },
    };
  },
});
