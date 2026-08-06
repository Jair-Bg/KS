import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "get_portfolio",
  title: "Get portfolio",
  description:
    "Get the signed-in user's demo balance, open bets and CLOB positions across all markets.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const userId = ctx.getUserId();
    const supabase = supabaseForUser(ctx);

    const [{ data: profile }, { data: bets }, { data: positions }] = await Promise.all([
      supabase.from("profiles").select("balance").eq("id", userId).maybeSingle(),
      supabase
        .from("bets")
        .select("id,market_id,option,amount,odds,potential_payout,status,created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50),
      supabase.from("positions").select("market_id,yes_qty,no_qty").eq("user_id", userId),
    ]);

    const payload = {
      balance: profile?.balance ?? 0,
      bets: bets ?? [],
      positions: positions ?? [],
    };
    return {
      content: [{ type: "text", text: JSON.stringify(payload) }],
      structuredContent: payload,
    };
  },
});
