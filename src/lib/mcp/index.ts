import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listMarketsTool from "./tools/list-markets";
import getMarketTool from "./tools/get-market";
import getPortfolioTool from "./tools/get-portfolio";
import placeBetTool from "./tools/place-bet";
import placeLimitOrderTool from "./tools/place-limit-order";
import cancelOrderTool from "./tools/cancel-order";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "kastia",
  title: "Kastia",
  version: "0.1.0",
  instructions:
    "Tools for Kastia, a prediction market platform. Browse active markets with `list_markets`, inspect odds and order book depth with `get_market`, review the signed-in user's balance, bets and positions with `get_portfolio`, and trade with `place_bet` (AMM markets), `place_limit_order` and `cancel_order` (CLOB markets).",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [
    listMarketsTool,
    getMarketTool,
    getPortfolioTool,
    placeBetTool,
    placeLimitOrderTool,
    cancelOrderTool,
  ],
});
