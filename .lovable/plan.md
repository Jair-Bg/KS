## Goal
Move Kastia off the local-storage mock onto the real Lovable Cloud backend (already configured) and layer on three differentiators: richer market UX, an AI prediction assistant, and polished embeds/sharing.

## Phase 1 — Real backend (foundation)
The DB schema (markets, bets, profiles, odds_history, watchlist, market_options) and the `place_bet` RPC already exist. We just need the app to use them.

- Rewrite `src/lib/api.ts` to call Supabase instead of `mockBackend` (markets, bets, watchlist, profile balance, creator stats).
- Restore `src/hooks/useAuth.ts` usage in `src/hooks/useWallet.ts` and `src/components/ProtectedRoute.tsx` (real session, real balance from `profiles`).
- Seed the DB with ~15 high-quality demo markets across categories (politics, crypto, sports, tech, culture) with 30 days of `odds_history` per market, via a migration that inserts rows owned by a system creator profile so they show up for everyone.
- Auth: email/password + Google sign-in. Don't auto-confirm email. Add `/reset-password`.
- Remove `mockBackend.ts` and the `markets-api` edge function (DB + RPC is enough; embeds will use a dedicated public endpoint — see Phase 4).
- Subscribe `OddsChart` and market lists to Supabase Realtime on `markets` and `odds_history` so odds update live after a bet.

## Phase 2 — Richer market UX
- Live odds ticker with smooth number transitions (framer-motion) on market cards and detail page.
- Order-book-style depth panel on `MarketDetail` showing recent bets, leaderboard of top traders for that market, and time-series volume.
- Comments per market (new `market_comments` table with RLS: read-all, write-own).
- Global leaderboard page ranking profiles by P&L from settled bets.
- Bet slip drawer: stage multiple picks then submit in one go (one RPC call per leg, optimistic UI).

## Phase 3 — AI prediction assistant
Uses Lovable AI Gateway (`LOVABLE_API_KEY` already set, no user key needed).

- New edge function `ai-market-insight` (verify_jwt off, CORS on): takes `market_id`, fetches the market + recent odds history, calls `google/gemini-2.5-flash` with a system prompt to return: probability estimate, top 3 drivers, suggested position, confidence. Streams the response.
- Upgrade `AIPredictionAssistant.tsx` to a chat panel inside `MarketDetail`: streaming answers with markdown rendering, "Explain this market", "What would move the odds?", "Compare to similar markets" quick-prompts.
- New "AI Picks" rail on the dashboard: edge function ranks active markets by AI-estimated edge vs current odds, cached for 10 min.

## Phase 4 — Embeds & sharing
- New public edge function `embed-market` (verify_jwt off): returns market JSON + increments `embed_views`. Used by the embed iframe so embeds don't depend on browser auth/session.
- `EmbedView.tsx` reads from that endpoint, supports `?pick=Yes&amount=25&autosubmit=1` for true one-click bets (prompts sign-in if needed via postMessage to parent).
- `public/sdk/embed.js`: theming (light/dark/auto), size presets, `data-` attribute API, postMessage events (`bet_placed`, `resize`, `clicked`) so host pages can react.
- Auto-generated OG share image per market: edge function `og-market` renders an SVG → PNG with the question, current odds bar, and Kastia branding. Wire into `MarketDetail` `<meta>` tags.
- "Share" button on each market: copy link, copy embed snippet, download OG image, share to X/Reddit with prefilled text.

## Technical details
- Tables to add via migration: `market_comments(id, market_id, user_id, body, created_at)`, plus `ALTER PUBLICATION supabase_realtime ADD TABLE markets, odds_history, bets, market_comments`.
- Edge functions to add: `ai-market-insight`, `embed-market`, `og-market`. All use `npm:@supabase/supabase-js@2/cors` for CORS.
- Seeding: a SQL migration that inserts a fixed `system_creator` profile (fixed UUID) and 15 markets + 450 odds_history rows.
- Keep the current charcoal/teal design system; reuse existing tokens, no palette change.
- `.env`: skipping per your answer — it only contains the public Supabase URL and anon key, which are designed to be public (RLS protects the data).

## Out of scope for this pass
- On-chain settlement (the `contracts/` Solidity stays untouched).
- Real-money payments.
- Mobile app.

## Rollout order
1. Phase 1 (backend swap + seed) — unblocks everything else.
2. Phase 4 embed endpoint (small, isolated).
3. Phase 3 AI assistant.
4. Phase 2 polish.

This is a lot for one turn. I'd suggest I ship **Phase 1 + the embed endpoint** first so the app is real and embeddable, then iterate on AI and UX polish in follow-ups. Reply "go" to start with Phase 1+4, or tell me a different order.