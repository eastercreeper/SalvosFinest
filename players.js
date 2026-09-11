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
   LOAD PLAYERS / TEAMS
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

        playerCount.textContent =
            "Unable to load players.";

        playersList.innerHTML = `
            <div class="player-row">
                <span>
                    Something went wrong while loading
                    the registered players.
                </span>
            </div>
        `;

        return;
    }


    const registeredPlayers = players || [];


    /* =====================================================
       LOAD CURRENT LOBBY STATE
    ===================================================== */

    const {
        data: lobby,
        error: lobbyError
    } = await supabaseClient
        .from("lobby_state")
        .select("teams")
        .eq("id", 1)
        .maybeSingle();


    if (lobbyError) {

        console.error(
            "Lobby loading error:",
            lobbyError
        );

        playerCount.textContent =
            `${registeredPlayers.length} PLAYER${registeredPlayers.length === 1 ? "" : "S"} REGISTERED`;

        renderPlayerList(
            registeredPlayers,
            playersList
        );

        return;
    }


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

    playerCount.textContent =
        `${registeredPlayers.length} PLAYER${registeredPlayers.length === 1 ? "" : "S"} REGISTERED`;

    renderPlayerList(
        registeredPlayers,
        playersList
    );
}


/* =========================================================
   RENDER PLAYER LIST
========================================================= */

function renderPlayerList(
    players,
    playersList
) {

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
                        ${index + 1}. ${player.apex_name}
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

    playerCount.textContent =
        "RANDOMIZED TEAMS";


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
                                        ${player.apex_name}
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
   INITIALIZE
========================================================= */

loadPlayers();


/* =========================================================
   CHECK FOR UPDATES
========================================================= */

setInterval(
    loadPlayers,
    3000
);