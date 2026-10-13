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
  detail: "Wildcard mode using the standard rules for the mode."
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
  detail: "RE-45, Wingman, P2020."
 },
 {
  name: "Submachine Guns",
  desc: "SMGs only.",
  detail: "R-99, CAR, Alternator, Prowler, Volt."
 },
 {
  name: "Assault Rifles",
  desc: "Assault Rifles only.",
  detail: "R-301, Flatline, Nemesis, Hemlok, Havoc."
 },
 {
  name: "LMGs",
  desc: "LMGs only.",
  detail: "Spitfire, Rampage, L-STAR, Devotion."
 },
 {
  name: "Marksman Rifles",
  desc: "Marksman Rifles only.",
  detail: "30-30 Repeater, G7 Scout, Triple Take, Bocek."
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
  detail: "Arc Star, Thermite, Frag Grenade."
 }
];


/* =========================================================
   GAME MODE DISPLAY
========================================================= */

function renderModes() {

 const modeGrid =
     document.getElementById("modeGrid");

 if (!modeGrid) {
  return;
 }

 modeGrid.innerHTML = modes.map((mode, index) => {

  return `
            <article class="card">

                <div class="card-img"></div>

                <div class="card-body">

                    <h3>${mode.name}</h3>

                    <p>${mode.desc}</p>

                    <span
                        class="rule-link"
                        onclick="showMode(${index})"
                    >
                        View Rules →
                    </span>

                </div>

            </article>
        `;

 }).join("");
}


/* =========================================================
   RULES MODAL
========================================================= */

function showMode(index) {

 const mode = modes[index];

 if (!mode) {
  return;
 }

 const modal =
     document.getElementById("rulesModal");

 const title =
     document.getElementById("modalTitle");

 const description =
     document.getElementById("modalDescription");

 const rules =
     document.getElementById("modalRules");


 if (
     !modal ||
     !title ||
     !description ||
     !rules
 ) {
  return;
 }


 title.textContent =
     mode.name;

 description.textContent =
     mode.desc;

 rules.textContent =
     mode.detail;


 modal.classList.add("show");

 document.body.style.overflow =
     "hidden";
}


function closeRules() {

 const modal =
     document.getElementById("rulesModal");

 if (!modal) {
  return;
 }

 modal.classList.remove("show");

 document.body.style.overflow =
     "";
}


document.addEventListener(
    "keydown",
    function (event) {

     if (event.key === "Escape") {
      closeRules();
     }

    }
);


/* =========================================================
   SIGN-UP FORM
========================================================= */

const signupForm =
    document.getElementById("signupForm");


if (signupForm) {

 signupForm.addEventListener(
     "submit",
     async function (event) {

      event.preventDefault();


      const discord =
          document
              .getElementById("soloDiscord")
              .value
              .trim();


      const apex =
          document
              .getElementById("soloApex")
              .value
              .trim();


      if (!discord || !apex) {

       toast(
           "Please fill out both fields."
       );

       return;
      }


      const submitButton =
          signupForm.querySelector(
              'button[type="submit"]'
          );


      submitButton.disabled =
          true;

      submitButton.textContent =
          "Submitting...";


      const {
       error
      } = await supabaseClient
          .from("players")
          .insert([
           {
            discord_name: discord,
            apex_name: apex,
            game_mode: "Any"
           }
          ]);


      if (error) {

       console.error(
           "Signup error:",
           error
       );

       toast(
           "Something went wrong. Please try again."
       );

       submitButton.disabled =
           false;

       submitButton.textContent =
           "Submit Registration";

       return;
      }


      toast(
          "Registration submitted!"
      );


      signupForm.reset();


      submitButton.disabled =
          false;

      submitButton.textContent =
          "Submit Registration";
     }
 );
}


/* =========================================================
   TOAST NOTIFICATION
========================================================= */

let toastTimeout;


function toast(message) {

 const toastElement =
     document.getElementById("toast");

 if (!toastElement) {
  return;
 }


 clearTimeout(
     toastTimeout
 );


 toastElement.textContent =
     message;

 toastElement.classList.add(
     "show"
 );


 toastTimeout =
     setTimeout(() => {

      toastElement.classList.remove(
          "show"
      );

     }, 3000);
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

renderModes();
initMobileNav();

document.querySelectorAll('a[href^="#"]').forEach(link => {
 link.addEventListener("click", function (event) {
  const target = document.querySelector(this.getAttribute("href"));

  if (!target) return;

  event.preventDefault();

  target.scrollIntoView({
   behavior: "smooth",
   block: "start"
  });

  history.replaceState(null, "", window.location.pathname);
 });
});
