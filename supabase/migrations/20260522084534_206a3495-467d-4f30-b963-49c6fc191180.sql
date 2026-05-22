
-- Drop creator FK so seed/system markets are allowed
ALTER TABLE public.markets DROP CONSTRAINT IF EXISTS markets_creator_id_fkey;

-- Trigger to auto-create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Realtime
ALTER TABLE public.markets REPLICA IDENTITY FULL;
ALTER TABLE public.bets REPLICA IDENTITY FULL;
ALTER TABLE public.odds_history REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='markets') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.markets;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='bets') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.bets;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='odds_history') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.odds_history;
  END IF;
END $$;

-- Seed markets
WITH seed_data(question, description, category, yes_odds, volume, total_traders, days_out) AS (
  VALUES
    ('Will Bitcoin close above $120K by end of month?',           'Resolves YES if BTC/USD spot price on Coinbase closes above $120,000 on the final day of the month.', 'crypto', 62, 482000, 1240, 21),
    ('Will Ethereum flip Bitcoin in market cap in 2026?',         'Resolves YES if ETH market cap exceeds BTC market cap on any day in 2026 (CoinGecko reference).',     'crypto', 11, 198400, 540, 220),
    ('Will Solana reach $500 before end of 2026?',                'Resolves YES if SOL/USD trades at $500 or above on any major exchange before Dec 31, 2026.',          'crypto', 34, 287500, 812, 240),
    ('Will the Fed cut rates at the next FOMC meeting?',          'Resolves YES if the FOMC announces a target rate cut at its next meeting.',                          'politics', 44, 612300, 1580, 14),
    ('Will the Democrats win the next US presidential election?', 'Resolves YES if the Democratic nominee wins the Electoral College in the next presidential election.', 'politics', 48, 891000, 2104, 365),
    ('Will the UK call a snap election this year?',               'Resolves YES if a UK general election is officially called before December 31.',                      'politics', 19, 145000, 410, 180),
    ('Will the Lakers make the NBA playoffs this season?',        'Resolves YES if the LA Lakers qualify for the 2026 NBA playoffs (top 10 West).',                     'sports', 71, 318500, 902, 45),
    ('Will Manchester City win the Premier League?',              'Resolves YES if Man City finishes 1st in the Premier League table at season end.',                   'sports', 38, 412800, 1320, 90),
    ('Will Max Verstappen win the F1 championship this season?',  'Resolves YES if Verstappen wins the Drivers'' Championship for the current season.',                 'sports', 58, 276400, 731, 120),
    ('Will OpenAI release GPT-6 before July 2026?',               'Resolves YES if OpenAI publicly announces a model branded GPT-6 with general availability before July 1, 2026.', 'tech', 28, 256700, 731, 60),
    ('Will Apple release AR glasses in 2026?',                    'Resolves YES if Apple ships consumer AR glasses (not Vision Pro) before Dec 31, 2026.',              'tech', 22, 198200, 612, 220),
    ('Will SpaceX successfully land Starship on the Moon by 2027?','Resolves YES upon a successful soft landing of a SpaceX Starship vehicle on the lunar surface.',     'tech', 22, 374600, 980, 365),
    ('Will Tesla deliver more than 2.5M cars this year?',         'Resolves YES if Tesla''s annual vehicle delivery report shows >= 2,500,000 deliveries.',              'tech', 41, 312900, 845, 300),
    ('Will Taylor Swift announce a new album this quarter?',      'Resolves YES upon official announcement of a new studio album by Taylor Swift.',                     'culture', 38, 142900, 410, 75),
    ('Will a new Marvel film cross $1B box office this year?',    'Resolves YES if any Marvel Studios release in the calendar year passes $1B worldwide gross.',        'culture', 55, 187300, 521, 200)
)
INSERT INTO public.markets (
  id, creator_id, question, description, category, market_type, status,
  yes_odds, no_odds, volume, total_traders, embed_views, end_date, created_at, updated_at
)
SELECT
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000a51'::uuid,
  question, description, category, 'binary', 'active',
  yes_odds, 100 - yes_odds, volume, total_traders, (volume / 4)::int,
  now() + (days_out || ' days')::interval,
  now() - interval '14 days',
  now()
FROM seed_data
WHERE NOT EXISTS (
  SELECT 1 FROM public.markets m WHERE m.question = seed_data.question
);

-- Seed odds history
DO $$
DECLARE
  m RECORD;
  i INT;
  y NUMERIC;
  target NUMERIC;
  drift NUMERIC;
BEGIN
  FOR m IN
    SELECT id, yes_odds FROM public.markets
    WHERE creator_id = '00000000-0000-0000-0000-000000000a51'::uuid
      AND NOT EXISTS (SELECT 1 FROM public.odds_history oh WHERE oh.market_id = markets.id)
  LOOP
    target := m.yes_odds;
    y := GREATEST(10, LEAST(90, target + (random()*30 - 15)));
    FOR i IN REVERSE 30..0 LOOP
      drift := (target - y) * 0.15;
      y := GREATEST(5, LEAST(95, y + drift + (random()*6 - 3)));
      INSERT INTO public.odds_history (market_id, yes_odds, no_odds, recorded_at)
      VALUES (m.id, ROUND(y), 100 - ROUND(y), now() - (i || ' days')::interval);
    END LOOP;
  END LOOP;
END $$;
