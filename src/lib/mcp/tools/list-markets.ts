import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";
import { withLogging } from "../logging";

export default defineTool({
  name: "list_markets",
  title: "List markets",
  description:
    "List active prediction markets, optionally filtered by category or a text search on the question.",
  inputSchema: {
    category: z.string().trim().min(1).optional().describe("Category filter, e.g. crypto."),
    search: z.string().trim().min(1).optional().describe("Text to match in the market question."),
    limit: z.number().int().min(1).max(50).optional().describe("Max markets to return (default 20)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: withLogging("list_markets", async ({ category, search, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    let query = supabase
      .from("markets")
      .select("id,question,category,status,yes_odds,no_odds,volume,end_date,engine")
      .eq("status", "active")
      .gt("end_date", new Date().toISOString())
      .order("volume", { ascending: false })
      .limit(limit ?? 20);
    if (category) query = query.eq("category", category);
    if (search) query = query.ilike("question", `%${search}%`);
    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { markets: data ?? [] },
    };
  }),
});
