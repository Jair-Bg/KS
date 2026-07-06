## Full CLOB + Market-Maker Bot

Replaces the AMM `place_bet` path for markets flagged as CLOB. Introduces a real limit order book with peer-to-peer matching, atomic $1 minting on complementary crosses, an inventory-tracked market-maker bot, and a creator UI to fire quotes on demand.

## Database (one migration)

**New tables** (all with GRANTs + RLS):

- `orders` — resting limit orders
  - `market_id`, `user_id`, `side` (buy/sell), `contract` (YES/NO), `price` (0.01–0.99), `quantity`, `filled`, `status` (open/filled/cancelled), `is_mm` (bool)
  - RLS: owner reads/inserts/cancels own; anon+authenticated SELECT for public book depth
- `positions` — per-user YES/NO token holdings per market
  - `user_id`, `market_id`, `yes_qty`, `no_qty`
- `mm_inventory` — bot's YES/NO holdings per market (drives skew)
  - `market_id`, `yes_qty`, `no_qty`, `target_notional`
- `trades` — executed fills log (`market_id`, `maker_order_id`, `taker_order_id`, `price`, `quantity`, `mint` bool)

**New column** on `markets`: `engine text default 'amm'` — `'amm'` or `'clob'`.

**New DB functions** (SECURITY DEFINER):

- `place_limit_order(market_id, side, contract, price, quantity)` — validates, inserts order, then calls `match_orders`.
- `match_orders(market_id)` — core engine. Two match modes:
  1. **Direct cross**: BUY YES @ p ≥ SELL YES @ p → transfer YES tokens between positions.
  2. **Complementary mint**: BUY YES @ pY + BUY NO @ pN where pY + pN ≥ 1.00 → lock $1 total collateral, mint 1 YES to YES buyer + 1 NO to NO buyer, refund the overage. Logs `trades.mint = true`.
- `cancel_order(order_id)` — owner only, refunds locked collateral.
- `mm_generate_quotes(market_id, p_model, confidence)` — creator/bot only. Computes Mid = p_model, spread = 0.01 (high conf) or 0.03 (low), applies inventory skew from `mm_inventory` (±up to 0.02 based on YES–NO imbalance), then places 4 limit orders (BUY/SELL YES + BUY/SELL NO). Returns the JSON payload matching the CLOB spec the user provided.

Collateral is deducted from `profiles.balance` when an order rests and refunded on cancel/mint-overage.

## Backend API layer

`src/lib/api.ts`:
- `placeLimitOrder`, `cancelOrder`, `fetchOrderBook(marketId)`, `fetchMyOrders`, `fetchMyPositions(marketId)`, `mmGenerateQuotes(marketId, pModel, confidence)`.

## Frontend

- **`OrderBook.tsx`** — when `market.engine === 'clob'`, "Book" tab reads real `orders` (not the synthesized ladder). "Depth" tab already dynamic — stays. Realtime channel on `orders` + `trades`.
- **`TradeTicket.tsx`** — for CLOB markets, adds Limit/Market toggle; Limit sends `place_limit_order`, Market sweeps the book via a single `place_limit_order` at 0.99/0.01.
- **New `MarketMakerPanel.tsx`** (creator-only, shown on `MarketDetail` when they own a CLOB market):
  - Inputs: P_model (0–1 slider), Confidence (High/Low), Quantity per side.
  - "Generate quotes" button → calls `mm_generate_quotes` → shows the returned JSON payload in a copyable code block AND the 4 orders land on the live book.
  - Inventory readout: YES/NO held, net delta.
- **`CreateMarket.tsx`** — add "Matching engine" toggle: AMM (default) vs CLOB.

## Technical details

- Spread rule: `spread = confidence === 'high' ? 0.01 : 0.03` (matches the ±$0.01 / ±$0.03 spec).
- Skew: `skew = clamp((yes_qty - no_qty) / max(target_notional, 1), -1, 1) * 0.02`. Bids and asks both shift by `-skew` when long YES.
- Complementary matching runs after direct matching each cycle; loop until no more crossable pairs.
- Minting event updates both users' `positions`, logs a `trades` row with `mint=true`, and does NOT move the market's midpoint via AMM — instead recomputes `markets.yes_odds` from the best bid/ask mid so charts keep working.
- Realtime publication: add `orders` and `trades`.
- Existing AMM markets are untouched; `place_bet` still works for `engine='amm'`.

## Out of scope

- No scheduled bot loop (on-demand only per your choice).
- No partial-cancel/replace API — cancel + repost.
- No cross-market netting.

Approve to proceed and I'll ship the migration first, then the API + UI.