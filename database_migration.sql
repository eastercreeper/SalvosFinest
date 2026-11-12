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

-- =========================================================
-- APEX CUSTOM GAME CHECK-IN
-- =========================================================

-- The Discord ID is currently stored in players.discord_name.
-- Keep that existing registration format and add attendance state.
ALTER TABLE IF EXISTS public.players
ADD COLUMN IF NOT EXISTS present BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE IF EXISTS public.lobby_state
ADD COLUMN IF NOT EXISTS check_in_enabled BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_players_discord_name_checkin
ON public.players (discord_name);
