-- =========================================================
-- SALVO'S FINEST: Discord Integration Schema Update
-- =========================================================

-- 1. Add discord_id column to players table (optional Snowflake ID for future-proof matching)
ALTER TABLE IF EXISTS public.players
ADD COLUMN IF NOT EXISTS discord_id TEXT;

-- 2. Create index on discord_name and discord_id for efficient lookups
CREATE INDEX IF NOT EXISTS idx_players_discord_name ON public.players (LOWER(discord_name));
CREATE INDEX IF NOT EXISTS idx_players_discord_id ON public.players (discord_id);

COMMENT ON COLUMN public.players.discord_id IS 'Unique Discord Snowflake User ID for deterministic role assignments';
