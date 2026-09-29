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
   GAME MODES
========================================================= */

const modes = [
    {
        name: "Trios",
        desc: "Regular rules.",
        detail: "Standard Trios rules."
    },

    {
        name: "Wildcard",
        desc: "Regular rules.",
        detail:
            "Wildcard mode using the standard rules for the mode."
    },

    {
        name: "Strict Trios",
        desc: "1 Legend from each selected class is banned.",
        detail:
            "At the beginning of each match, one Legend from " +
            "Skirmisher, Assault, Recon, Support, and Controller " +
            "is randomly selected and banned for that match."
    },

    {
        name: "Shotguns & Snipers",
        desc: "Shotguns and snipers only.",
        detail:
            "Charge Rifle, Sentinel, Longbow, Kraber, " +
            "Mozambique, EVA-8, Mastiff, Peacekeeper."
    },

    {
        name: "Pistols",
        desc: "Pistols only.",
        detail:
            "RE-45, Wingman, P2020."
    },

    {
        name: "Submachine Guns",
        desc: "SMGs only.",
        detail:
            "R-99, CAR, Alternator, Prowler, Volt."
    },

    {
        name: "Assault Rifles",
        desc: "Assault Rifles only.",
        detail:
            "R-301, Flatline, Nemesis, Hemlok, Havoc."
    },

    {
        name: "LMGs",
        desc: "LMGs only.",
        detail:
            "Spitfire, Rampage, L-STAR, Devotion."
    },

    {
        name: "Marksman Rifles",
        desc: "Marksman Rifles only.",
        detail:
            "30-30 Repeater, G7 Scout, Triple Take, Bocek."
    },

    {
        name: "Hide N Seek Trios",
        desc: "One squad seeks. One squad hides.",
        detail:
            "Seekers may use weapons. Hiders have no weapons " +
            "or heals and may use tacticals to escape. No ultimates."
    },

    {
        name: "Melee",
        desc: "Melee only. Olympus — Fight Night.",
        detail:
            "No abilities, ultimates, or weapons. 3v3 rounds. " +
            "Winners advance until one squad remains."
    },

    {
        name: "Nades",
        desc: "Grenades only.",
        detail:
            "Arc Star, Thermite, Frag Grenade."
    }
];


/* =========================================================
   STRICT TRIOS — LEGEND POOLS
========================================================= */

const banned = {

    Skirmisher: [
        "Wraith",
        "Octane",
        "Pathfinder",
        "Horizon",
        "Valkyrie"
    ],

    Assault: [
        "Bangalore",
        "Fuse",
        "Ash",
        "Mad Maggie",
        "Ballistic"
    ],

    Recon: [
        "Bloodhound",
        "Crypto",
        "Seer",
        "Vantage"
    ],

    Support: [
        "Gibraltar",
        "Lifeline",
        "Mirage",
        "Loba",
        "Newcastle"
    ],

    Controller: [
        "Caustic",
        "Wattson",
        "Rampart",
        "Catalyst"
    ]
};


/* =========================================================
   VARIABLES
========================================================= */

let registeredPlayers = [];
let currentLobby = null;

let toastTimeout;


/* =========================================================
   DOM ELEMENTS
========================================================= */

const loginSection =
    document.getElementById("loginSection");

const adminSection =
    document.getElementById("adminSection");

const loginForm =
    document.getElementById("loginForm");

const logoutButton =
    document.getElementById("logoutButton");

const spinTeamsButton =
    document.getElementById("spinTeamsButton");

const spinModeButton =
    document.getElementById("spinModeButton");

const clearLobbyButton =
    document.getElementById("clearLobbyButton");

const clearPlayersButton =
    document.getElementById("clearPlayersButton");

const currentMode =
    document.getElementById("currentMode");

const currentModeDetails =
    document.getElementById("currentModeDetails");

const teamResults =
    document.getElementById("teamResults");

const scheduleForm =
    document.getElementById("scheduleForm");

const scheduleEventId =
    document.getElementById("scheduleEventId");

const scheduleTitle =
    document.getElementById("scheduleTitle");

const scheduleGameMode =
    document.getElementById("scheduleGameMode");

const scheduleDate =
    document.getElementById("scheduleDate");

const scheduleStartTime =
    document.getElementById("scheduleStartTime");

const scheduleEndTime =
    document.getElementById("scheduleEndTime");

const scheduleDescription =
    document.getElementById("scheduleDescription");

const saveScheduleEvent =
    document.getElementById("saveScheduleEvent");

const cancelScheduleEdit =
    document.getElementById("cancelScheduleEdit");

const adminScheduleEvents =
    document.getElementById("adminScheduleEvents");


/* =========================================================
   TOAST
========================================================= */

function toast(message) {

    const toastElement =
        document.getElementById("toast");

    if (!toastElement) {
        return;
    }

    clearTimeout(toastTimeout);

    toastElement.textContent = message;

    toastElement.classList.add("show");

    toastTimeout = setTimeout(() => {

        toastElement.classList.remove("show");

    }, 3000);
}


/* =========================================================
   SHOW LOGIN
========================================================= */

function showLogin() {

    loginSection.style.display = "block";

    adminSection.style.display = "none";

    logoutButton.style.display = "none";
}


/* =========================================================
   SHOW ADMIN
========================================================= */

function showAdmin() {

    loginSection.style.display = "none";

    adminSection.style.display = "block";

    logoutButton.style.display = "block";
}


/* =========================================================
   CHECK ADMIN ACCESS
========================================================= */

async function checkAdminAccess() {

    const {
        data: {
            user
        }
    } = await supabaseClient.auth.getUser();

    if (!user) {
        showLogin();
        return;
    }

    const {
        data,
        error
    } = await supabaseClient
        .from("admin_users")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle();

    if (error) {
        console.error("Admin verification error:", error);
        alert("Unable to verify admin access.");
        return;
    }

    if (!data) {
        alert("You are not an admin.");
        await supabaseClient.auth.signOut();
        showLogin();
        return;
    }

    showAdmin();

    await loadPlayers();

    await loadLobbyState();

    populateScheduleModes();

    await loadScheduleEvents();
}

/* =========================================================
   LOGIN
========================================================= */

if (loginForm) {

    loginForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();

            const usernameInput =
                document.getElementById("username");

            const passwordInput =
                document.getElementById("password");

            const loginButton =
                document.getElementById("loginButton");

            if (!usernameInput || !passwordInput || !loginButton) {
                console.error(
                    "Login form elements could not be found."
                );

                toast("Login form is missing required fields.");
                return;
            }

            const username =
                usernameInput.value.trim();

            const password =
                passwordInput.value;

            if (!username || !password) {
                toast("Enter your username and password.");
                return;
            }

            loginButton.disabled = true;
            loginButton.textContent = "Logging in...";


            /* -------------------------------------------------
               LOOK UP THE AUTH EMAIL FOR THIS USERNAME
            ------------------------------------------------- */

            const {
                data: adminEmail,
                error: lookupError
            } = await supabaseClient.rpc(
                "get_admin_email",
                {
                    requested_username: username
                }
            );

            if (lookupError) {

                console.error(
                    "Username lookup error:",
                    lookupError
                );

                toast("Unable to find username.");

                loginButton.disabled = false;
                loginButton.textContent = "Login";

                return;
            }


            /* -------------------------------------------------
               MAKE SURE THE USERNAME EXISTS
            ------------------------------------------------- */

            if (!adminEmail) {

                console.error(
                    "No admin account found for username:",
                    username
                );

                toast("Invalid username or password.");

                loginButton.disabled = false;
                loginButton.textContent = "Login";

                return;
            }


            /* -------------------------------------------------
               SIGN IN USING THE AUTH EMAIL
            ------------------------------------------------- */

            const {
                error: loginError
            } = await supabaseClient.auth.signInWithPassword({
                email: adminEmail,
                password: password
            });

            if (loginError) {

                console.error(
                    "Login error:",
                    loginError
                );

                toast("Invalid username or password.");

                loginButton.disabled = false;
                loginButton.textContent = "Login";

                return;
            }


            /* -------------------------------------------------
               AUTHENTICATION SUCCEEDED
               NOW VERIFY ADMIN ACCESS
            ------------------------------------------------- */

            loginButton.disabled = false;
            loginButton.textContent = "Login";

            await checkAdminAccess();
        }
    );
}
/* =========================================================
   LOGOUT
========================================================= */

if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        async function () {

            await supabaseClient.auth.signOut();

            registeredPlayers = [];

            currentLobby = null;

            showLogin();

            toast("Logged out.");

        }
    );
}


/* =========================================================
   LOAD PLAYERS
========================================================= */

async function loadPlayers() {

    const {
        data,
        error
    } = await supabaseClient
        .from("players")
        .select("*")
        .order("signed_up_at", {
            ascending: true
        });


    if (error) {

        console.error(
            "Player loading error:",
            error
        );

        toast(
            "Unable to load players."
        );

        return;
    }


    registeredPlayers = data || [];
}


/* =========================================================
   LOAD CURRENT LOBBY STATE
========================================================= */

async function loadLobbyState() {

    const {
        data,
        error
    } = await supabaseClient
        .from("lobby_state")
        .select("*")
        .eq("id", 1)
        .maybeSingle();


    if (error) {

        console.error(
            "Lobby state loading error:",
            error
        );

        toast(
            "Unable to load lobby state."
        );

        return;
    }


    currentLobby = data;

    renderLobbyState();
}


/* =========================================================
   RENDER LOBBY STATE
========================================================= */

function renderLobbyState() {

    if (!currentLobby) {
        return;
    }


    currentMode.textContent =
        currentLobby.game_mode ||
        "Not Selected";


    currentModeDetails.textContent =
        currentLobby.game_mode_details ||
        "The host has not selected a game mode yet.";


    renderTeams(
        currentLobby.teams
    );
}


/* =========================================================
   RENDER TEAMS
========================================================= */

function renderTeams(teams) {

    if (
        !teams ||
        !Array.isArray(teams) ||
        teams.length === 0
    ) {

        teamResults.innerHTML = `
            <div class="player-row">
                <span>
                    Teams have not been randomized yet.
                </span>
            </div>
        `;

        return;
    }


    teamResults.innerHTML =
        teams.map((team, teamIndex) => {

            return `
                <div class="team-block">

                    <h3>
                        Team ${teamIndex + 1}
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

        }).join("");
}


/* =========================================================
   UPDATE LOBBY STATE
========================================================= */

async function updateLobbyState(updates) {
    const { error } = await supabaseClient
        .from("lobby_state")
        .update({
            ...updates,
            updated_at: new Date().toISOString()
        })
        .eq("id", 1);

    if (error) {
        console.error("Lobby update error:", error);
        toast("Unable to save lobby changes.");
        return false;
    }

    // Update the local admin screen immediately
    currentLobby = {
        ...currentLobby,
        ...updates,
        updated_at: new Date().toISOString()
    };

    renderLobbyState();

    return true;
}

/* =========================================================
   SHUFFLE PLAYERS
========================================================= */

function shufflePlayers(players) {

    const shuffled = [...players];


    for (
        let i = shuffled.length - 1;
        i > 0;
        i--
    ) {

        const randomIndex =
            Math.floor(
                Math.random() * (i + 1)
            );


        [
            shuffled[i],
            shuffled[randomIndex]
        ] = [
            shuffled[randomIndex],
            shuffled[i]
        ];
    }


    return shuffled;
}


/* =========================================================
   SPIN TEAMS
========================================================= */

if (spinTeamsButton) {

    spinTeamsButton.addEventListener(
        "click",
        async function () {

            if (registeredPlayers.length === 0) {

                toast(
                    "No registered players yet."
                );

                return;
            }


            spinTeamsButton.disabled = true;

            spinTeamsButton.textContent =
                "Spinning...";


            const shuffledPlayers =
                shufflePlayers(
                    registeredPlayers
                );


            const newTeams = [];


            /*
               Create teams of 3.
            */

            for (
                let i = 0;
                i < shuffledPlayers.length;
                i += 3
            ) {

                newTeams.push(
                    shuffledPlayers.slice(
                        i,
                        i + 3
                    )
                );
            }


            /*
               Save only the information
               we need to display publicly.
            */

            const teamsForDatabase =
                newTeams.map(team => {

                    return team.map(player => {

                        return {
                            id: player.id,
                            apex_name: player.apex_name
                        };

                    });

                });


            const success =
                await updateLobbyState({

                    teams: teamsForDatabase

                });


            spinTeamsButton.disabled = false;

            spinTeamsButton.textContent =
                "↻ Spin Teams";


            if (success) {

                toast(
                    "Teams randomized!"
                );
            }

        }
    );
}


/* =========================================================
   SPIN GAME MODE
========================================================= */

if (spinModeButton) {

    spinModeButton.addEventListener(
        "click",
        async function () {

            spinModeButton.disabled = true;

            spinModeButton.textContent =
                "Spinning...";


            const randomIndex =
                Math.floor(
                    Math.random() * modes.length
                );


            const mode =
                modes[randomIndex];


            let modeDetails =
                mode.detail;


            /*
               STRICT TRIOS
            */

            if (
                mode.name ===
                "Strict Trios"
            ) {

                const picks =
                    Object.entries(banned)
                        .map(
                            ([className, legends]) => {

                                const randomLegend =
                                    legends[
                                        Math.floor(
                                            Math.random() *
                                            legends.length
                                        )
                                        ];


                                return (
                                    `${className}: ` +
                                    `${randomLegend}`
                                );

                            }
                        )
                        .join(" • ");


                modeDetails =
                    `${mode.detail} ` +
                    `Banned Legends: ${picks}`;
            }


            const success =
                await updateLobbyState({

                    game_mode:
                    mode.name,

                    game_mode_details:
                    modeDetails

                });


            spinModeButton.disabled = false;

            spinModeButton.textContent =
                "↻ Spin Game Mode";


            if (success) {

                toast(
                    `${mode.name} selected!`
                );
            }

        }
    );
}
/* =========================================================
   CLEAR LOBBY
========================================================= */

if (clearLobbyButton) {

    clearLobbyButton.addEventListener(
        "click",
        async function () {

            const confirmed = confirm(
                "Clear the current lobby?\n\n" +
                "This will remove the randomized teams and " +
                "reset the game mode.\n\n" +
                "Registered players will NOT be deleted."
            );

            if (!confirmed) {
                return;
            }

            clearLobbyButton.disabled = true;
            clearLobbyButton.textContent = "Clearing...";


            const success = await updateLobbyState({
                game_mode: "Not Selected",
                game_mode_details:
                    "The host has not selected a game mode yet.",
                teams: []
            });


            clearLobbyButton.disabled = false;
            clearLobbyButton.textContent = "Clear Lobby";


            if (success) {
                toast("Lobby cleared!");
            }

        }
    );

}

/* =========================================================
   CLEAR REGISTERED PLAYERS
========================================================= */

if (clearPlayersButton) {
    clearPlayersButton.addEventListener(
        "click",
        async function () {
            const confirmed = confirm(
                "Clear the entire lobby?\n\n" +
                "This will permanently remove all registered players, " +
                "wipe the randomized teams, and reset the game mode.\n\n" +
                "This cannot be undone."
            );

            if (!confirmed) {
                return;
            }

            clearPlayersButton.disabled = true;
            clearPlayersButton.textContent = "Clearing...";

            // Delete all registered players
            const { error: playersError } = await supabaseClient
                .from("players")
                .delete()
                .not("id", "is", null);

            if (playersError) {
                console.error(
                    "Player clearing error:",
                    playersError
                );

                alert(
                    "Unable to clear players.\n\n" +
                    playersError.message
                );

                clearPlayersButton.disabled = false;
                clearPlayersButton.textContent =
                    "Clear Registered Players";

                return;
            }

            // Reset the lobby
            const success = await updateLobbyState({
                game_mode: "Not Selected",
                game_mode_details:
                    "The host has not selected a game mode yet.",
                teams: []
            });

            if (!success) {
                clearPlayersButton.disabled = false;
                clearPlayersButton.textContent =
                    "Clear Registered Players";

                return;
            }

            // Clear local player list
            registeredPlayers = [];

            clearPlayersButton.disabled = false;
            clearPlayersButton.textContent =
                "Clear Registered Players";

            toast("Lobby cleared!");
        }
    );
}


/* =========================================================
   SCHEDULE MANAGEMENT
========================================================= */

async function loadScheduleEvents() {

    if (!adminScheduleEvents) {
        return;
    }


    const {
        data,
        error
    } = await supabaseClient
        .from("schedule_events")
        .select("*")
        .order("event_date", {
            ascending: true
        })
        .order("start_time", {
            ascending: true
        });


    if (error) {

        console.error(
            "Schedule loading error:",
            error
        );

        adminScheduleEvents.innerHTML = `
            <div class="player-row">
                <span>
                    Unable to load scheduled events.
                </span>
            </div>
        `;

        return;
    }


    renderAdminScheduleEvents(
        data || []
    );
}


/* =========================================================
   GAME MODE DROPDOWN
========================================================= */

function populateScheduleModes() {

    if (!scheduleGameMode) {
        return;
    }

    scheduleGameMode.innerHTML = `
        <option value="">
            Select game mode
        </option>

        <option value="Undecided">
            Undecided
        </option>
    `;

    modes.forEach(mode => {

        const option =
            document.createElement("option");

        option.value =
            mode.name;

        option.textContent =
            mode.name;

        scheduleGameMode.appendChild(option);
    });
}


/* =========================================================
   RENDER ADMIN EVENTS
========================================================= */

function renderAdminScheduleEvents(
    events
) {

    if (!adminScheduleEvents) {
        return;
    }


    if (events.length === 0) {

        adminScheduleEvents.innerHTML = `
            <div class="player-row">
                <span>
                    No scheduled events.
                </span>
            </div>
        `;

        return;
    }


    adminScheduleEvents.innerHTML =
        events
            .map(
                event => {

                    return `
                        <div class="admin-schedule-event">

                            <div class="admin-schedule-event-info">

                                <div class="admin-schedule-event-title">
                                    ${escapeHtml(event.title)}
                                </div>

                                <div class="admin-schedule-event-meta">
                                    ${formatScheduleDate(event.event_date)}
                                    ${formatScheduleTimeRange(
                        event.start_time,
                        event.end_time
                    )}
                                </div>

                                <div class="admin-schedule-event-mode">
                                    ${escapeHtml(
                        event.game_mode ||
                        "Custom Event"
                    )}
                                </div>

                                ${
                        event.description
                            ? `
                                            <div class="admin-schedule-event-description">
                                                ${escapeHtml(
                                event.description
                            )}
                                            </div>
                                        `
                            : ""
                    }

                            </div>


                            <div class="admin-schedule-event-actions">

                                <button
                                    type="button"
                                    class="btn secondary edit-schedule-button"
                                    data-id="${event.id}"
                                >
                                    Edit
                                </button>

                                <button
                                    type="button"
                                    class="btn danger delete-schedule-button"
                                    data-id="${event.id}"
                                >
                                    Delete
                                </button>

                            </div>

                        </div>
                    `;
                }
            )
            .join("");


    document
        .querySelectorAll(
            ".edit-schedule-button"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => editScheduleEvent(
                        Number(button.dataset.id)
                    )
                );
            }
        );


    document
        .querySelectorAll(
            ".delete-schedule-button"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => deleteScheduleEvent(
                        Number(button.dataset.id)
                    )
                );
            }
        );
}


/* =========================================================
   ADD / EDIT EVENT
========================================================= */

if (scheduleForm) {

    scheduleForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            const id =
                scheduleEventId.value;


            const eventData = {

                title:
                    scheduleTitle.value.trim(),

                description:
                    scheduleDescription.value.trim() ||
                    null,

                event_date:
                scheduleDate.value,

                start_time:
                    scheduleStartTime.value ||
                    null,

                end_time:
                    scheduleEndTime.value ||
                    null,

                game_mode:
                    scheduleGameMode.value ||
                    null,

                updated_at:
                    new Date().toISOString()
            };


            if (
                !eventData.title ||
                !eventData.event_date
            ) {

                toast(
                    "Enter an event title and date."
                );

                return;
            }


            saveScheduleEvent.disabled =
                true;

            saveScheduleEvent.textContent =
                id
                    ? "Saving..."
                    : "Adding...";


            let error;


            if (id) {

                const result =
                    await supabaseClient
                        .from("schedule_events")
                        .update(eventData)
                        .eq(
                            "id",
                            Number(id)
                        );

                error =
                    result.error;

            } else {

                const result =
                    await supabaseClient
                        .from("schedule_events")
                        .insert(
                            eventData
                        );

                error =
                    result.error;
            }


            if (error) {

                console.error(
                    "Schedule save error:",
                    error
                );

                toast(
                    "Unable to save schedule event."
                );

                saveScheduleEvent.disabled =
                    false;

                saveScheduleEvent.textContent =
                    id
                        ? "Save Changes"
                        : "Add Event";

                return;
            }


            resetScheduleForm();

            await loadScheduleEvents();

            toast(
                id
                    ? "Event updated!"
                    : "Event added!"
            );
        }
    );
}


/* =========================================================
   EDIT EVENT
========================================================= */

async function editScheduleEvent(
    id
) {

    const {
        data,
        error
    } = await supabaseClient
        .from("schedule_events")
        .select("*")
        .eq("id", id)
        .maybeSingle();


    if (error || !data) {

        console.error(
            "Schedule event loading error:",
            error
        );

        toast(
            "Unable to load that event."
        );

        return;
    }


    scheduleEventId.value =
        data.id;

    scheduleTitle.value =
        data.title || "";

    scheduleGameMode.value =
        data.game_mode || "";

    scheduleDate.value =
        data.event_date || "";

    scheduleStartTime.value =
        data.start_time
            ? data.start_time.substring(
                0,
                5
            )
            : "";

    scheduleEndTime.value =
        data.end_time
            ? data.end_time.substring(
                0,
                5
            )
            : "";

    scheduleDescription.value =
        data.description || "";


    saveScheduleEvent.textContent =
        "Save Changes";

    cancelScheduleEdit.style.display =
        "inline-flex";


    scheduleForm.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}


/* =========================================================
   DELETE EVENT
========================================================= */

async function deleteScheduleEvent(
    id
) {

    const confirmed =
        confirm(
            "Delete this scheduled event?\n\n" +
            "This cannot be undone."
        );


    if (!confirmed) {
        return;
    }


    const {
        error
    } = await supabaseClient
        .from("schedule_events")
        .delete()
        .eq("id", id);


    if (error) {

        console.error(
            "Schedule delete error:",
            error
        );

        toast(
            "Unable to delete event."
        );

        return;
    }


    await loadScheduleEvents();

    toast(
        "Event deleted!"
    );
}


/* =========================================================
   RESET FORM
========================================================= */

function resetScheduleForm() {

    if (!scheduleForm) {
        return;
    }


    scheduleForm.reset();

    scheduleEventId.value =
        "";

    saveScheduleEvent.textContent =
        "Add Event";

    cancelScheduleEdit.style.display =
        "none";
}


if (cancelScheduleEdit) {

    cancelScheduleEdit.addEventListener(
        "click",
        resetScheduleForm
    );
}


/* =========================================================
   DATE / TIME FORMATTING
========================================================= */

function formatScheduleDate(
    value
) {

    if (!value) {
        return "";
    }


    const [
        year,
        month,
        day
    ] = value
        .split("-")
        .map(Number);


    const date =
        new Date(
            year,
            month - 1,
            day
        );


    return date.toLocaleDateString(
        "en-US",
        {
            month: "short",
            day: "numeric",
            year: "numeric"
        }
    );
}


function formatScheduleTime(
    value
) {

    if (!value) {
        return "";
    }


    const [
        hours,
        minutes
    ] = value
        .split(":")
        .map(Number);


    const date =
        new Date();

    date.setHours(
        hours,
        minutes,
        0,
        0
    );


    return date.toLocaleTimeString(
        "en-US",
        {
            hour: "numeric",
            minute: "2-digit"
        }
    );
}


function formatScheduleTimeRange(
    start,
    end
) {

    if (!start && !end) {
        return "";
    }


    if (start && !end) {
        return (
            " • " +
            formatScheduleTime(start)
        );
    }


    if (!start && end) {
        return (
            " • Until " +
            formatScheduleTime(end)
        );
    }


    return (
        " • " +
        formatScheduleTime(start) +
        " – " +
        formatScheduleTime(end)
    );
}


/* =========================================================
   HTML ESCAPING
========================================================= */

function escapeHtml(
    value
) {

    const div =
        document.createElement("div");

    div.textContent =
        value ?? "";

    return div.innerHTML;
}


/* =========================================================
   INITIALIZE SCHEDULE ADMIN
========================================================= */

populateScheduleModes();

/* =========================================================
   INITIALIZE
========================================================= */

showLogin();

checkAdminAccess();