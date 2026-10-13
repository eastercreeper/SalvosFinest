/* =========================================================
   SUPABASE CONNECTION
========================================================= */

const SUPABASE_URL = "https://byrgpygkirkjdcnmicbm.supabase.co";
const SUPABASE_KEY = "sb_publishable_ZFDDoT7EYIfx5w4HEWQeGg_8h7eJIVA";

const supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);


/* =========================================================
   LOAD PLAYERS / TEAMS & GAME MODE
========================================================= */

async function loadPlayers() {

    const playersList =
        document.getElementById("playersList");

    const playerCount =
        document.getElementById("playerCount");


    /* =====================================================
       LOAD REGISTERED PLAYERS
    ===================================================== */

    const {
        data: players,
        error: playersError
    } = await supabaseClient
        .from("players")
        .select("*")
        .order("signed_up_at", {
            ascending: true
        });


    if (playersError) {

        console.error(
            "Player loading error:",
            playersError
        );

        if (playerCount) {
            playerCount.textContent =
                "Unable to load players.";
        }

        if (playersList) {
            playersList.innerHTML = `
                <div class="player-row">
                    <span>
                        Something went wrong while loading
                        the registered players.
                    </span>
                </div>
            `;
        }

        return;
    }


    const registeredPlayers = players || [];


    /* =====================================================
       LOAD CURRENT LOBBY STATE (MODE & TEAMS)
    ===================================================== */

    const {
        data: lobby,
        error: lobbyError
    } = await supabaseClient
        .from("lobby_state")
        .select("*")
        .eq("id", 1)
        .maybeSingle();


    if (lobbyError) {

        console.error(
            "Lobby loading error:",
            lobbyError
        );

        renderGameModeBanner(
            "Unable to Load",
            "API is down or unable to load game mode."
        );

        if (playerCount) {
            playerCount.textContent =
                `${registeredPlayers.length} PLAYER${registeredPlayers.length === 1 ? "" : "S"} REGISTERED`;
        }

        if (playersList) {
            renderPlayerList(
                registeredPlayers,
                playersList
            );
        }

        return;
    }


    /* =====================================================
       RENDER GAME MODE BANNER
    ===================================================== */

    const gameMode =
        lobby?.game_mode || "Not Selected";

    const gameModeDetails =
        lobby?.game_mode_details ||
        "The host has not selected a game mode yet.";

    renderGameModeBanner(
        gameMode,
        gameModeDetails
    );


    /* =====================================================
       CHECK IF TEAMS HAVE BEEN RANDOMIZED
    ===================================================== */

    const teams =
        lobby?.teams;


    if (
        Array.isArray(teams) &&
        teams.length > 0
    ) {

        renderTeams(
            teams,
            playerCount,
            playersList
        );

        return;
    }


    /* =====================================================
       SHOW REGISTERED PLAYERS
    ===================================================== */

    if (playerCount) {
        playerCount.textContent =
            `${registeredPlayers.length} PLAYER${registeredPlayers.length === 1 ? "" : "S"} REGISTERED`;
    }

    if (playersList) {
        renderPlayerList(
            registeredPlayers,
            playersList
        );
    }
}


/* =========================================================
   RENDER GAME MODE BANNER
========================================================= */

function renderGameModeBanner(mode, details) {

    const bannerModeName =
        document.getElementById("bannerModeName");

    const bannerModeDetails =
        document.getElementById("bannerModeDetails");

    if (bannerModeName) {
        bannerModeName.textContent =
            mode ? mode.toUpperCase() : "NOT SELECTED";
    }

    if (bannerModeDetails) {
        bannerModeDetails.textContent =
            details || "The host has not selected a game mode yet.";
    }
}


/* =========================================================
   ESCAPE HTML UTILITY
========================================================= */

function escapeHtml(text) {

    if (!text) return "";

    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* =========================================================
   RENDER PLAYER LIST
========================================================= */

function renderPlayerList(
    players,
    playersList
) {

    if (!playersList) {
        return;
    }

    if (players.length === 0) {

        playersList.innerHTML = `
            <div class="player-row">
                <span>
                    No players have registered yet.
                </span>
            </div>
        `;

        return;
    }


    playersList.innerHTML =
        players.map((player, index) => {

            return `
                <div class="player-row">

                    <span>
                        ${index + 1}. ${escapeHtml(player.apex_name)}
                    </span>

                    <span class="badge">
                        PLAYER
                    </span>

                </div>
            `;

        }).join("");
}


/* =========================================================
   RENDER RANDOMIZED TEAMS
========================================================= */

function renderTeams(
    teams,
    playerCount,
    playersList
) {

    if (playerCount) {
        playerCount.textContent =
            "RANDOMIZED TEAMS";
    }

    if (!playersList) {
        return;
    }


    playersList.innerHTML = `
        <div class="teams-container">

            ${teams.map((team, teamIndex) => {

        return `
                    <div class="team-block">

                        <h3>
                            TEAM ${teamIndex + 1}
                        </h3>

                        ${team.map(player => {

            return `
                                <div class="player-row">

                                    <span>
                                        ${escapeHtml(player.apex_name)}
                                    </span>

                                    <span class="badge">
                                        PLAYER
                                    </span>

                                </div>
                            `;

        }).join("")}

                    </div>
                `;

    }).join("")}

        </div>
    `;
}


/* =========================================================
   MOBILE NAVIGATION
========================================================= */

function initMobileNav() {
    const navToggle = document.getElementById("navToggle");
    const mainNav = document.getElementById("mainNav");

    if (!navToggle || !mainNav) {
        return;
    }

    navToggle.addEventListener("click", () => {
        const isOpen = mainNav.classList.toggle("is-open");
        navToggle.classList.toggle("open", isOpen);
        navToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });

    mainNav.querySelectorAll("a, button").forEach(item => {
        item.addEventListener("click", () => {
            mainNav.classList.remove("is-open");
            navToggle.classList.remove("open");
            navToggle.setAttribute("aria-expanded", "false");
        });
    });

    document.addEventListener("click", event => {
        if (!mainNav.contains(event.target) && !navToggle.contains(event.target)) {
            mainNav.classList.remove("is-open");
            navToggle.classList.remove("open");
            navToggle.setAttribute("aria-expanded", "false");
        }
    });
}


/* =========================================================
   INITIALIZE
========================================================= */

initMobileNav();
loadPlayers();


/* =========================================================
   CHECK FOR UPDATES
========================================================= */

setInterval(
    loadPlayers,
    3000
);