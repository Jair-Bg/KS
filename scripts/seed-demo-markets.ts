/**
 * Seed demo markets so embeds always have content.
 *
 * Usage:
 *   bun run scripts/seed-demo-markets.ts
 *
 * Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in env.
 * (Set them once: `export SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=...`)
 */
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const inDays = (n: number) =>
  new Date(Date.now() + n * 24 * 60 * 60 * 1000).toISOString();

const DEMO_MARKETS = [
  {
    question: "Will Bitcoin close above $150K by end of 2026?",
    description: "Resolves YES if BTC/USD closes above $150,000 on Dec 31, 2026 (Coinbase).",
    category: "crypto",
    market_type: "binary",
    yes_odds: 62,
    no_odds: 38,
    volume: 184_000,
    total_traders: 1240,
    end_date: inDays(60),
  },
  {
    question: "Will the Lakers make the 2026 NBA Finals?",
    description: "Resolves YES if the LA Lakers reach the 2026 NBA Finals.",
    category: "sports",
    market_type: "binary",
    yes_odds: 28,
    no_odds: 72,
    volume: 92_500,
    total_traders: 643,
    end_date: inDays(45),
  },
  {
    question: "Will OpenAI release GPT-6 before July 2026?",
    description: "Resolves YES if OpenAI publicly announces GPT-6 before July 1, 2026.",
    category: "tech",
    market_type: "binary",
    yes_odds: 41,
    no_odds: 59,
    volume: 312_700,
    total_traders: 2105,
    end_date: inDays(30),
  },
  {
    question: "Will SpaceX successfully land Starship on the Moon in 2026?",
    description: "Resolves YES on confirmed soft landing of any Starship vehicle on the lunar surface in 2026.",
    category: "science",
    market_type: "binary",
    yes_odds: 18,
    no_odds: 82,
    volume: 47_300,
    total_traders: 389,
    end_date: inDays(120),
  },
  {
    question: "Will the S&P 500 finish 2026 above 7,000?",
    description: "Resolves YES if SPX closes above 7,000 on the last trading day of 2026.",
    category: "finance",
    market_type: "binary",
    yes_odds: 54,
    no_odds: 46,
    volume: 221_900,
    total_traders: 1587,
    end_date: inDays(75),
  },
  {
    question: "Will any AI model surpass 90% on ARC-AGI by end of 2026?",
    description: "Resolves YES on a verified score ≥90% on the public ARC-AGI benchmark.",
    category: "tech",
    market_type: "binary",
    yes_odds: 35,
    no_odds: 65,
    volume: 68_100,
    total_traders: 472,
    end_date: inDays(90),
  },
];

async function main() {
  // Pick a creator: first profile in the system, else fail with instructions.
  const { data: profile, error: pErr } = await supabase
    .from("profiles")
    .select("user_id")
    .limit(1)
    .maybeSingle();

  if (pErr) throw pErr;
  if (!profile?.user_id) {
    console.error("No profiles found. Sign up at least one user first, then re-run.");
    process.exit(1);
  }
  const creatorId = profile.user_id;
  console.log(`Using creator_id=${creatorId}`);

  let created = 0;
  let skipped = 0;

  for (const m of DEMO_MARKETS) {
    const { data: existing } = await supabase
      .from("markets")
      .select("id")
      .eq("question", m.question)
      .maybeSingle();

    if (existing) {
      skipped++;
      console.log(`• skip (exists): ${m.question}`);
      continue;
    }

    const { error } = await supabase.from("markets").insert({
      ...m,
      creator_id: creatorId,
      status: "active",
    });

    if (error) {
      console.error(`✗ failed: ${m.question}`, error.message);
    } else {
      created++;
      console.log(`✓ created: ${m.question}`);
    }
  }

  console.log(`\nDone. Created ${created}, skipped ${skipped}.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
