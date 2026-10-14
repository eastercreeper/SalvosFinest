/**
 * Salvo's Finest Apex Custom Lobbies - Discord Bot & Synchronization Server
 */

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { Client, GatewayIntentBits } = require("discord.js");
const { createClient } = require("@supabase/supabase-js");
const { syncTeamsWithDiscord, clearAllTeamRoles } = require("./sync");

// Environment Configuration
const PORT = process.env.PORT || 3001;
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const DISCORD_GUILD_ID = process.env.DISCORD_GUILD_ID;
const SUPABASE_URL = process.env.SUPABASE_URL || "https://byrgpygkirkjdcnmicbm.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
const BOT_API_SECRET = process.env.BOT_API_SECRET;
const CORS_ORIGIN = process.env.CORS_ORIGIN || "*";

// Initialize Supabase Client
const supabase = (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY)
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: { persistSession: false }
    })
    : null;

// Initialize Discord Client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers
    ]
});

// Initialize Express App
const app = express();
app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json());

/**
 * Middleware to authenticate API requests from Admin dashboard
 */
async function authenticateRequest(req, res, next) {
    const authHeader = req.headers.authorization;
    const apiSecretHeader = req.headers["x-api-secret"];

    // 1. Check optional static API secret
    if (BOT_API_SECRET) {
        if (apiSecretHeader === BOT_API_SECRET || (authHeader && authHeader === `Bearer ${BOT_API_SECRET}`)) {
            return next();
        }
    }

    // 2. Validate Supabase JWT Bearer Token
    if (authHeader && authHeader.startsWith("Bearer ") && supabase) {
        const token = authHeader.slice(7).trim();
        try {
            const { data: { user }, error } = await supabase.auth.getUser(token);
            if (error || !user) {
                return res.status(401).json({
                    error: "Unauthorized",
                    message: "Invalid or expired Supabase authentication token."
                });
            }
            req.user = user;
            return next();
        } catch (authErr) {
            console.error("[Auth] Token verification failed:", authErr.message);
            return res.status(401).json({
                error: "Unauthorized",
                message: "Authentication verification failed."
            });
        }
    }

    // If no secret is configured and no token passed, require auth if in production
    if (BOT_API_SECRET || supabase) {
        return res.status(401).json({
            error: "Unauthorized",
            message: "Missing authorization credentials (Supabase JWT or API Secret)."
        });
    }

    // Fallback in open dev mode
    next();
}

/**
 * Health check endpoint
 */
app.get("/api/health", (req, res) => {
    const isReady = client.isReady();
    const guild = isReady && DISCORD_GUILD_ID ? client.guilds.cache.get(DISCORD_GUILD_ID) : null;

    res.json({
        status: "ok",
        discord: {
            connected: isReady,
            botUser: isReady ? client.user.tag : null,
            guildConfigured: Boolean(DISCORD_GUILD_ID),
            guildFound: Boolean(guild),
            guildName: guild ? guild.name : null,
            memberCount: guild ? guild.memberCount : null
        },
        timestamp: new Date().toISOString()
    });
});

/**
 * Team role synchronization endpoint
 * Triggered after admin spins teams on the website.
 */
app.post("/api/sync-teams", authenticateRequest, async (req, res) => {
    try {
        if (!client.isReady()) {
            return res.status(503).json({
                success: false,
                error: "Discord Bot is not connected or gateway is offline."
            });
        }

        const guild = client.guilds.cache.get(DISCORD_GUILD_ID);
        if (!guild) {
            return res.status(500).json({
                success: false,
                error: `Configured Discord server (ID: ${DISCORD_GUILD_ID}) was not found. Please verify the bot is in the server.`
            });
        }

        let teams = req.body.teams;

        // If teams are not provided in request body, fetch the authoritative lobby state from Supabase
        if (!teams && supabase) {
            const { data: lobby, error: lobbyError } = await supabase
                .from("lobby_state")
                .select("teams")
                .eq("id", 1)
                .maybeSingle();

            if (lobbyError) {
                return res.status(500).json({
                    success: false,
                    error: `Database query error: ${lobbyError.message}`
                });
            }

            teams = lobby?.teams || [];
        }

        // Fetch registered players from database to ensure complete discord_name / discord_id matching
        if (supabase) {
            const { data: players, error: playersError } = await supabase
                .from("players")
                .select("*");

            if (!playersError && Array.isArray(players) && Array.isArray(teams)) {
                const playerMap = new Map();
                for (const p of players) {
                    if (p.id) playerMap.set(String(p.id), p);
                    if (p.apex_name) playerMap.set(p.apex_name.toLowerCase(), p);
                }

                // Enrich teams with database player records
                teams = teams.map(team => {
                    return team.map(player => {
                        const dbPlayer = (player.id && playerMap.get(String(player.id))) ||
                                         (player.apex_name && playerMap.get(player.apex_name.toLowerCase()));
                        return {
                            ...player,
                            discord_name: player.discord_name || dbPlayer?.discord_name || null,
                            discord_id: player.discord_id || dbPlayer?.discord_id || null
                        };
                    });
                });
            }
        }

        console.log(`[API] Triggering Discord role sync for ${teams ? teams.length : 0} teams.`);
        const syncResult = await syncTeamsWithDiscord(guild, teams || []);

        return res.json(syncResult);
    } catch (err) {
        console.error("[API] Sync error:", err);
        return res.status(500).json({
            success: false,
            error: err.message || "An unexpected error occurred during Discord synchronization."
        });
    }
});

/**
 * Clear lobby team roles endpoint
 */
app.post("/api/clear-roles", authenticateRequest, async (req, res) => {
    try {
        if (!client.isReady()) {
            return res.status(503).json({
                success: false,
                error: "Discord Bot is not connected."
            });
        }

        const guild = client.guilds.cache.get(DISCORD_GUILD_ID);
        if (!guild) {
            return res.status(500).json({
                success: false,
                error: `Discord server (ID: ${DISCORD_GUILD_ID}) not found.`
            });
        }

        console.log(`[API] Clearing team roles in guild "${guild.name}"...`);
        const result = await clearAllTeamRoles(guild);

        return res.json(result);
    } catch (err) {
        console.error("[API] Clear roles error:", err);
        return res.status(500).json({
            success: false,
            error: err.message || "Failed to clear team roles."
        });
    }
});

// Discord Event Listeners
client.once("ready", () => {
    console.log(`[Discord Bot] Logged in as ${client.user.tag}`);
    if (DISCORD_GUILD_ID) {
        const guild = client.guilds.cache.get(DISCORD_GUILD_ID);
        if (guild) {
            console.log(`[Discord Bot] Target Guild: "${guild.name}" (ID: ${guild.id}) - ${guild.memberCount} members`);
        } else {
            console.warn(`[Discord Bot] Target Guild ID ${DISCORD_GUILD_ID} not found in bot's guilds.`);
        }
    } else {
        console.warn("[Discord Bot] DISCORD_GUILD_ID is not configured in .env!");
    }
});

// Start Server and Discord Bot
if (DISCORD_BOT_TOKEN) {
    client.login(DISCORD_BOT_TOKEN).catch(err => {
        console.error("[Discord Bot] Login failed:", err.message);
    });
} else {
    console.warn("[Discord Bot] DISCORD_BOT_TOKEN not provided in environment variables. Bot will start in API-only/offline mode.");
}

app.listen(PORT, () => {
    console.log(`[Server] Salvo's Finest Discord Sync API running on port ${PORT}`);
});

module.exports = { app, client };
