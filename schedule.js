const SUPABASE_URL =
    "https://byrgpygkirkjdcnmicbm.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_ZFDDoT7EYIfx5w4HEWQeGg_8h7eJIVA";

const supabaseClient =
    supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );


let currentDate = new Date();

let scheduleEvents = [];


const currentMonth =
    document.getElementById("currentMonth");

const calendarDays =
    document.getElementById("calendarDays");

const previousMonth =
    document.getElementById("previousMonth");

const nextMonth =
    document.getElementById("nextMonth");

const scheduleEmpty =
    document.getElementById("scheduleEmpty");

const eventModal =
    document.getElementById("eventModal");

const closeEventModal =
    document.getElementById("closeEventModal");

const modalTitle =
    document.getElementById("modalTitle");

const modalGameMode =
    document.getElementById("modalGameMode");

const modalDate =
    document.getElementById("modalDate");

const modalTime =
    document.getElementById("modalTime");

const modalDescription =
    document.getElementById("modalDescription");


/* =========================================================
   LOAD EVENTS
========================================================= */

async function loadEvents() {

    const year =
        currentDate.getFullYear();

    const month =
        currentDate.getMonth();

    const firstDay =
        new Date(
            year,
            month,
            1
        );

    const lastDay =
        new Date(
            year,
            month + 1,
            0
        );

    const startDate =
        formatDate(firstDay);

    const endDate =
        formatDate(lastDay);


    const {
        data,
        error
    } = await supabaseClient
        .from("schedule_events")
        .select("*")
        .gte("event_date", startDate)
        .lte("event_date", endDate)
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

        scheduleEvents = [];

        renderCalendar();

        return;
    }


    scheduleEvents =
        data || [];

    renderCalendar();
}


/* =========================================================
   RENDER CALENDAR
========================================================= */

function renderCalendar() {

    const year =
        currentDate.getFullYear();

    const month =
        currentDate.getMonth();


    currentMonth.textContent =
        new Intl.DateTimeFormat(
            "en-US",
            {
                month: "long",
                year: "numeric"
            }
        ).format(currentDate);


    calendarDays.innerHTML = "";


    const firstDay =
        new Date(
            year,
            month,
            1
        ).getDay();


    const daysInMonth =
        new Date(
            year,
            month + 1,
            0
        ).getDate();


    const previousMonthDays =
        new Date(
            year,
            month,
            0
        ).getDate();


    /*
     * Previous month's trailing days
     */

    for (
        let i = firstDay - 1;
        i >= 0;
        i--
    ) {

        const day =
            previousMonthDays - i;

        const cell =
            createCalendarDay(
                day,
                true
            );

        calendarDays.appendChild(cell);
    }


    /*
     * Current month
     */

    for (
        let day = 1;
        day <= daysInMonth;
        day++
    ) {

        const cell =
            createCalendarDay(
                day,
                false
            );

        calendarDays.appendChild(cell);
    }


    /*
     * Next month's leading days
     */

    const totalCells =
        calendarDays.children.length;

    const remaining =
        42 - totalCells;

    for (
        let day = 1;
        day <= remaining;
        day++
    ) {

        const cell =
            createCalendarDay(
                day,
                true
            );

        calendarDays.appendChild(cell);
    }


    scheduleEmpty.style.display =
        scheduleEvents.length === 0
            ? "block"
            : "none";
}


/* =========================================================
   CREATE CALENDAR DAY
========================================================= */

function createCalendarDay(
    day,
    outsideMonth
) {

    const cell =
        document.createElement("div");

    cell.className =
        "calendar-day";


    if (outsideMonth) {

        cell.classList.add(
            "outside-month"
        );

        const number =
            document.createElement("div");

        number.className =
            "calendar-day-number";

        number.textContent =
            day;

        cell.appendChild(number);

        return cell;
    }


    const year =
        currentDate.getFullYear();

    const month =
        currentDate.getMonth();


    const date =
        new Date(
            year,
            month,
            day
        );


    const dateString =
        formatDate(date);


    const today =
        new Date();


    if (
        today.getFullYear() === year &&
        today.getMonth() === month &&
        today.getDate() === day
    ) {

        cell.classList.add(
            "today"
        );
    }


    const number =
        document.createElement("div");

    number.className =
        "calendar-day-number";

    number.textContent =
        day;

    cell.appendChild(number);


    const eventsForDay =
        scheduleEvents.filter(
            event =>
                event.event_date === dateString
        );


    eventsForDay.forEach(
        event => {

            const eventElement =
                document.createElement("button");

            eventElement.type =
                "button";

            eventElement.className =
                "calendar-event";


            const title =
                document.createElement("strong");

            title.textContent =
                event.title;


            const mode =
                document.createElement("span");

            mode.textContent =
                event.game_mode || "Custom Lobby";


            eventElement.appendChild(
                title
            );

            eventElement.appendChild(
                mode
            );


            eventElement.addEventListener(
                "click",
                () => openEventModal(event)
            );


            cell.appendChild(
                eventElement
            );
        }
    );


    return cell;
}


/* =========================================================
   EVENT MODAL
========================================================= */

function openEventModal(event) {

    modalTitle.textContent =
        event.title;


    modalGameMode.textContent =
        event.game_mode ||
        "CUSTOM EVENT";


    const eventDate =
        parseDateString(
            event.event_date
        );


    modalDate.textContent =
        eventDate.toLocaleDateString(
            "en-US",
            {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric"
            }
        );


    modalTime.textContent =
        formatTimeRange(
            event.start_time,
            event.end_time
        );


    modalDescription.textContent =
        event.description ||
        "No additional information provided.";


    eventModal.classList.remove(
        "hidden"
    );
}


function closeModal() {

    eventModal.classList.add(
        "hidden"
    );
}


closeEventModal.addEventListener(
    "click",
    closeModal
);


eventModal.addEventListener(
    "click",
    function (event) {

        if (
            event.target ===
            eventModal
        ) {
            closeModal();
        }
    }
);


document.addEventListener(
    "keydown",
    function (event) {

        if (
            event.key === "Escape"
        ) {
            closeModal();
        }
    }
);


/* =========================================================
   MONTH NAVIGATION
========================================================= */

previousMonth.addEventListener(
    "click",
    async function () {

        currentDate.setMonth(
            currentDate.getMonth() - 1
        );

        await loadEvents();
    }
);


nextMonth.addEventListener(
    "click",
    async function () {

        currentDate.setMonth(
            currentDate.getMonth() + 1
        );

        await loadEvents();
    }
);


/* =========================================================
   DATE HELPERS
========================================================= */

function formatDate(date) {

    const year =
        date.getFullYear();

    const month =
        String(
            date.getMonth() + 1
        ).padStart(
            2,
            "0"
        );

    const day =
        String(
            date.getDate()
        ).padStart(
            2,
            "0"
        );

    return `${year}-${month}-${day}`;
}


function parseDateString(value) {

    const [
        year,
        month,
        day
    ] = value
        .split("-")
        .map(Number);

    return new Date(
        year,
        month - 1,
        day
    );
}


function formatTime(time) {

    if (!time) {
        return "";
    }


    const [
        hours,
        minutes
    ] = time
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


function formatTimeRange(
    start,
    end
) {

    if (!start && !end) {
        return "Time not specified";
    }

    if (start && !end) {
        return formatTime(start);
    }

    if (!start && end) {
        return formatTime(end);
    }

    return (
        formatTime(start) +
        " – " +
        formatTime(end)
    );
}


/* =========================================================
   INITIAL LOAD
========================================================= */

loadEvents();


/*
 * Refresh the schedule periodically so changes
 * made by the admin appear automatically.
 */

setInterval(
    loadEvents,
    10000
);