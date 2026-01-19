// app.js

// 1) Paste the SHA-256 hash (hex) of the CORRECT secret phrase here.
// You will generate it once using the Admin panel in the UI.
const CORRECT_PHRASE_HASH_HEX =
  "559e13c28aaac095cac0e1e2c726e6efee385ceb41536e9acd0295dfeab80802";

// Optional signature name:
const SIGNATURE_NAME = "Manju";

// Add your photos here (put them in /assets and use paths like "assets/1.jpg")
const PHOTO_URLS = [
  // Example placeholders — replace with your 40 photos
  // "assets/1.jpg",
  // "assets/2.jpg",
];

// Elements (these may be null if you removed the old inputs — we guard for that)
const q1 = document.getElementById("q1");
const q2 = document.getElementById("q2");
const q3 = document.getElementById("q3");
const q4 = document.getElementById("q4");
const q5 = document.getElementById("q5");
const pw = document.getElementById("pw");

const unlockBtn = document.getElementById("unlockBtn");
const resetBtn = document.getElementById("resetBtn");
const errorMsg = document.getElementById("errorMsg");
const successMsg = document.getElementById("successMsg");

const lockedOverlay = document.getElementById("lockedOverlay");
const envelope = document.getElementById("envelope");
const scroll = document.getElementById("scroll");
const letterWrap = document.querySelector(".letterWrap");
const revealTitle = document.getElementById("revealTitle");

const dateStamp = document.getElementById("dateStamp");
const sig = document.getElementById("sig");

const yesBtn = document.getElementById("yesBtn");
const noBtn = document.getElementById("noBtn");
const answerArea = document.getElementById("answerArea");

const collageOverlay = document.getElementById("collageOverlay");
const collageStage = document.getElementById("collageStage");
const collageClose = document.getElementById("collageClose");

const hintsBox = document.getElementById("hintsBox");
const attemptsText = document.getElementById("attemptsText");

const genHashBtn = document.getElementById("genHashBtn");
const hashOut = document.getElementById("hashOut");

// Helpers
function normalize(s) {
  return (s || "").trim().toLowerCase();
}
function lettersOnly(s) {
  return normalize(s).replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim();
}
function canonicalWord(s) {
  return lettersOnly(s).replace(/\s/g, "");
}
function getVal(el) {
  return el && typeof el.value === "string" ? el.value : "";
}

// Most common letter from a string (letters only)
function mostCommonLetter(text) {
  const t = normalize(text).replace(/[^a-z]/g, "");
  if (!t) return "";
  const freq = {};
  for (const c of t) freq[c] = (freq[c] || 0) + 1;
  return Object.keys(freq).sort((a, b) => freq[b] - freq[a])[0];
}

// Extract "rose" from second word (singularize roses->rose)
function flowerSingular(flowers) {
  const parts = lettersOnly(flowers).split(" ").filter(Boolean);
  const second = parts[1] || "";
  if (!second) return "";
  if (second === "roses") return "rose";
  if (second.endsWith("s") && second.length > 3) return second.slice(0, -1);
  return second;
}

// Build the secret phrase from answers (intended to become "cupidrosela")
function derivedPhraseFromAnswers() {
  // Use DOM inputs if they exist; otherwise these will be filled by wizardAnswers when wizard completes
  const nick = canonicalWord(getVal(q1));
  const CU = nick.slice(0, 2);

  const I = mostCommonLetter(getVal(q2));

  const song = canonicalWord(getVal(q3));
  const P = song[0] || "";

  const parts = lettersOnly(getVal(q5)).split(" ").filter(Boolean);
  const colour = parts[0] || "";
  const D = colour ? colour.slice(-1) : "";
  const ROSE = flowerSingular(getVal(q5));

  const meet = canonicalWord(getVal(q4));
  const LA = meet.includes("lax") ? "la" : meet.slice(0, 2);

  return `${CU}${I}${P}${D}${ROSE}${LA}`;
}

// SHA-256 hex
async function sha256Hex(text) {
  const enc = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  const bytes = Array.from(new Uint8Array(buf));
  return bytes.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// UI lock/unlock
function setUnlocked(state) {
  if (!lockedOverlay) return;
  lockedOverlay.style.display = state ? "none" : "flex";
}

let failedAttempts = 0;
function updateAttemptsUI() {
  if (!attemptsText) return;

  if (failedAttempts === 0) {
    attemptsText.textContent = "";
  } else {
    attemptsText.textContent = `Unlock attempts: ${failedAttempts} (hints unlock after 3)`;
  }

  if (failedAttempts >= 3) {
    hintsBox?.classList.remove("hidden");
  } else {
    hintsBox?.classList.add("hidden");
  }
}

// Notify choice via Netlify Forms
async function notifyChoice(choice) {
  const data = new URLSearchParams();
  data.append("form-name", "valentine-result");
  data.append("choice", choice);
  data.append("timestamp", new Date().toISOString());
  data.append("note", "Valentine site response");

  await fetch("/", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: data.toString(),
  });
}

// Collage
function showCollage() {
  if (!collageStage || !collageOverlay) return;

  collageStage.innerHTML = "";
  collageOverlay.classList.add("show");

  const W = collageStage.clientWidth;
  const H = collageStage.clientHeight;

  const picks = (PHOTO_URLS.length ? PHOTO_URLS : []).slice(0, 40);

  if (picks.length === 0) {
    const msg = document.createElement("div");
    msg.style.padding = "20px";
    msg.style.color = "white";
    msg.style.fontFamily = "system-ui, sans-serif";
    msg.textContent =
      "Add your photos into /assets and list them in PHOTO_URLS in app.js 💖";
    collageStage.appendChild(msg);
    return;
  }

  picks.forEach((src, i) => {
    const img = document.createElement("img");
    img.src = src;
    img.className = "collageImg";

    const x = Math.max(0, Math.floor(Math.random() * (W - 240)));
    const y = Math.max(0, Math.floor(Math.random() * (H - 240)));
    const r = `${Math.floor(Math.random() * 22 - 11)}deg`;

    img.style.left = `${x}px`;
    img.style.top = `${y}px`;
    img.style.setProperty("--r", r);
    img.style.animationDelay = `${i * 35}ms`;

    collageStage.appendChild(img);
  });
}

collageClose?.addEventListener("click", () => {
  collageOverlay?.classList.remove("show");
});

// NO button dodge
function dodgeNoButton() {
  if (!noBtn) return;

  const dx = Math.round(Math.random() * 260 - 130);
  const dy = Math.round(Math.random() * 140 - 70);
  noBtn.style.transform = `translate(${dx}px, ${dy}px)`;
}

noBtn?.addEventListener("mouseenter", dodgeNoButton);
noBtn?.addEventListener("mousedown", (e) => {
  e.preventDefault();
  dodgeNoButton();
});
noBtn?.addEventListener(
  "touchstart",
  (e) => {
    e.preventDefault();
    dodgeNoButton();
  },
  { passive: false }
);

// YES / NO
yesBtn?.addEventListener("click", async () => {
  if (answerArea)
    answerArea.textContent =
      "You just made my whole heart smile. Happy Valentine’s Day, my love ❤️";
  showCollage();
  try {
    await notifyChoice("YES");
  } catch (e) {}
});

noBtn?.addEventListener("click", async () => {
  if (answerArea) answerArea.textContent = "Nice try 😌";
  try {
    await notifyChoice("NO");
  } catch (e) {}
});

// Unlock
unlockBtn?.addEventListener("click", async () => {
  if (errorMsg) errorMsg.style.display = "none";
  if (successMsg) successMsg.style.display = "none";

  const typed = canonicalWord(getVal(pw));
  const hash = await sha256Hex(typed);

  if (CORRECT_PHRASE_HASH_HEX !== "PASTE_HASH_HERE" && hash === CORRECT_PHRASE_HASH_HEX) {
    failedAttempts = 0;
    updateAttemptsUI();

    setUnlocked(true);
    if (successMsg) successMsg.style.display = "block";

    // NEW: trigger wax crack + hearts burst + letter slide-out
    if (typeof unlockEnvelope === "function") unlockEnvelope();

    // cinematic reveal
    letterWrap?.classList.add("unlocked");
    envelope?.classList.add("zoom");
    envelope?.classList.add("open");

    setTimeout(() => {
      scroll?.classList.remove("hidden");
      if (scroll) scroll.scrollTop = 0;
    }, 900);
  } else {
    failedAttempts++;
    updateAttemptsUI();

    setUnlocked(false);
    if (errorMsg) errorMsg.style.display = "block";

    letterWrap?.classList.remove("unlocked");
    envelope?.classList.remove("zoom");
    envelope?.classList.remove("open");
    scroll?.classList.add("hidden");
  }
});

// Reset
resetBtn?.addEventListener("click", () => {
  if (q1) q1.value = "";
  if (q2) q2.value = "";
  if (q3) q3.value = "";
  if (q4) q4.value = "";
  if (q5) q5.value = "";
  if (pw) pw.value = "";

  if (errorMsg) errorMsg.style.display = "none";
  if (successMsg) successMsg.style.display = "none";
  setUnlocked(false);

  failedAttempts = 0;
  updateAttemptsUI();

  letterWrap?.classList.remove("unlocked");
  envelope?.classList.remove("zoom");
  envelope?.classList.remove("open");
  scroll?.classList.add("hidden");
});

// Admin: generate hash for the CORRECT phrase
genHashBtn?.addEventListener("click", async () => {
  const derived = derivedPhraseFromAnswers();
  const derivedHash = await sha256Hex(derived);

  const typed = canonicalWord(getVal(pw));
  const typedHash = typed ? await sha256Hex(typed) : "";

  if (!hashOut) return;

  hashOut.textContent =
    `Derived from answers: ${derived}\n` +
    `SHA-256(derived): ${derivedHash}\n\n` +
    (typed
      ? `Typed phrase: ${typed}\nSHA-256(typed): ${typedHash}\n\n`
      : "") +
    `Paste SHA-256(typed) if your typed phrase is the correct one.\n` +
    `Or paste SHA-256(derived) if you want the answers to auto-derive the correct phrase.`;
});

// Date + signature
if (dateStamp) {
  dateStamp.textContent = new Date().toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
if (sig) sig.textContent = `— Yours, ${SIGNATURE_NAME}`;

// Initial state
scroll?.classList.add("hidden");
envelope?.classList.remove("zoom");
envelope?.classList.remove("open");
setUnlocked(false);
updateAttemptsUI();

/* -------------------- BACKGROUND: HEARTS -------------------- */
(function softLuxeHeartsOnly() {
  const canvas = document.getElementById("heartsCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  let W = 0,
    H = 0;

  function resize() {
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W * devicePixelRatio;
    canvas.height = H * devicePixelRatio;
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  }

  window.addEventListener("resize", resize);
  resize();

  function rand(a, b) {
    return a + Math.random() * (b - a);
  }

  const COUNT = 200;
  const WIND = 0.3;
  const COLORS = [
    "rgba(255, 230, 240, 0.85)",
    "rgba(255, 170, 210, 0.88)",
    "rgba(255, 105, 180, 0.92)",
    "rgba(255, 20, 147, 0.92)",
    "rgba(255, 45, 85, 0.92)",
    "rgba(220, 20, 60, 0.92)",
  ];

  const hearts = Array.from({ length: COUNT }).map(() => ({
    x: rand(0, W),
    y: rand(0, H),
    s: rand(0.7, 1.6),
    v: rand(0.35, 1.1),
    vx: rand(-0.3, 0.3),
    r: rand(-Math.PI, Math.PI),
    vr: rand(-0.006, 0.006),
    wob: rand(0.6, 1.6),
    wobPhase: rand(0, 1000),
    a: rand(0.16, 0.32),
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
  }));

  function drawHeart(x, y, scale, rot, alpha, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.globalAlpha = alpha;

    ctx.fillStyle = color;
    ctx.beginPath();
    const s = 10 * scale;
    ctx.moveTo(0, -s / 2);
    ctx.bezierCurveTo(-s, -s * 1.35, -s * 2.15, -s * 0.15, 0, s * 1.65);
    ctx.bezierCurveTo(s * 2.15, -s * 0.15, s, -s * 1.35, 0, -s / 2);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "rgba(255, 0, 80, 0.16)";
    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.restore();
  }

  function tick() {
    ctx.clearRect(0, 0, W, H);

    for (const h of hearts) {
      h.wobPhase += 0.012 * h.wob;
      const drift = Math.sin(h.wobPhase) * WIND;

      h.x += h.vx + drift;
      h.y += h.v;
      h.r += h.vr;

      if (h.x < -40) h.x = W + 40;
      if (h.x > W + 40) h.x = -40;

      if (h.y > H + 60) {
        h.y = -60;
        h.x = rand(0, W);
        h.v = rand(0.35, 1.1);
        h.vx = rand(-0.3, 0.3);
        h.s = rand(0.7, 1.6);
        h.a = rand(0.16, 0.32);
        h.color = COLORS[Math.floor(Math.random() * COLORS.length)];
      }

      drawHeart(h.x, h.y, h.s, h.r, h.a, h.color);
    }

    requestAnimationFrame(tick);
  }

  tick();
})();

/* -------------------- BACKGROUND: KISS POPUPS -------------------- */
(function lipstickKissPopups() {
  const layer = document.getElementById("kissLayer");
  if (!layer) return;

  const KISS_IMG_URLS = ["kiss.png"];

  const MIN_MS = 900;
  const MAX_MS = 1700;
  const MAX_ON_SCREEN = 10;
  const MIN_SIZE = 64;
  const MAX_SIZE = 140;

  function rand(a, b) {
    return a + Math.random() * (b - a);
  }
  function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function spawn() {
    if (layer.childElementCount >= MAX_ON_SCREEN) return;

    const el = document.createElement("div");
    el.className = "kissPop";

    const size = Math.round(rand(MIN_SIZE, MAX_SIZE));
    const rot = Math.round(rand(-18, 18));
    const dur = Math.round(rand(5200, 9000));
    const op = rand(0.10, 0.22).toFixed(2);

    const margin = 24;
    const x = Math.round(rand(margin, window.innerWidth - margin - size));
    const y = Math.round(rand(margin, window.innerHeight - margin - size));

    el.style.left = `${x}px`;
    el.style.top = `${y}px`;

    el.style.setProperty("--size", `${size}px`);
    el.style.setProperty("--rot", `${rot}deg`);
    el.style.setProperty("--dur", `${dur}ms`);
    el.style.setProperty("--op", op);
    el.style.setProperty("--img", `url("${pick(KISS_IMG_URLS)}")`);

    layer.appendChild(el);
    setTimeout(() => el.remove(), dur + 200);
  }

  function loop() {
    spawn();
    const next = Math.round(rand(MIN_MS, MAX_MS));
    setTimeout(loop, next);
  }

  loop();
})();

/* -------------------- WIZARD (ONE-BY-ONE QUESTIONS) -------------------- */
const questEnvelope = document.getElementById("questEnvelope");
const questCard = document.getElementById("questCard");
const questProgress = document.getElementById("questProgress");
const questDots = document.getElementById("questDots");
const questQText = document.getElementById("questQText");
const questInput = document.getElementById("questInput");
const questHint = document.getElementById("questHint");
const questNextBtn = document.getElementById("questNextBtn");
const questResetBtn = document.getElementById("questResetBtn");
const questError = document.getElementById("questError");
const questOk = document.getElementById("questOk");
const questDone = document.getElementById("questDone");

// SHA-256 hashes of the correct answers AFTER lettersOnly() normalization.
// (So he can type with normal capitalization/spaces.)
const ANSWER_HASHES = {
  q1: ["35864ba5082fd4f2e1896a4ad0929fe3cb3e91cadc4477f5ab749bc56fd8e800"], // cuddles
  q2: [
    "53c404d76a9dd996a35c023f07e8e357b931cb2316dc90de006c9be68ed8cad5", // griffith observatory
    "1be93f69c4abc29339f94ec98afe173e5b9188536c13eb819ba18b8864065615", // griffiths observatory
  ],
  q3: ["fafe97f7def328bbd4f10779b9625a8aa0bfaa143d7ae64e6f5770e47b51cd1d"], // perfect
  q4: [
    "15968064f35a3c943cc6ff5e3d4a9b24c316be499dbf23dc67af3773b11cf517", // lax airport
    "b11e23303e7d8bc69ecf65d611409528002d7a0151abbd93de3d325908d69498", // lax
  ],
  q5: ["0fec3ba25c39108be1c345aa72a493670297aadb24c59e7e03de1019927e9c1b"], // red roses
};

const WIZARD = [
  {
    key: "q1",
    label: "1) The very first nickname you gave me",
    placeholder: "Hint: one word",
    hint: "One word. The first nickname you ever gave me.",
  },
  {
    key: "q2",
    label: "2) The place where I wished we had our first kiss",
    placeholder: "Hint: two words",
    hint: "Two words. We accept Griffith / Griffiths (Observatory).",
  },
  {
    key: "q3",
    label: "3) The song we both fell in love with and kept playing in Vegas",
    placeholder: "Hint: one word",
    hint: "One word. Vegas song.",
  },
  {
    key: "q4",
    label: "4) Where we first met physically",
    placeholder: "Hint: airport name",
    hint: "It’s an airport. (Think code too.)",
  },
  {
    key: "q5",
    label: "5) Which flowers did you gift me on our first physical meet",
    placeholder: "Hint: two words",
    hint: "Two words. First = colour, second = flower type.",
  },
];

let wizardIndex = 0;
let wizardTries = 0;
const wizardAnswers = { q1: "", q2: "", q3: "", q4: "", q5: "" };

function renderDots() {
  if (!questDots) return;
  questDots.innerHTML = "";
  WIZARD.forEach((_, i) => {
    const s = document.createElement("span");
    if (i <= wizardIndex) s.classList.add("on");
    questDots.appendChild(s);
  });
}

function showQuestion() {
  const step = WIZARD[wizardIndex];
  if (questProgress) questProgress.textContent = `Question ${wizardIndex + 1} of ${WIZARD.length}`;
  if (questQText) questQText.textContent = step.label;

  if (questInput) {
    questInput.value = "";
    questInput.placeholder = step.placeholder;
  }

  if (questError) questError.style.display = "none";
  if (questOk) questOk.style.display = "none";

  wizardTries = 0;

  if (questHint) {
    questHint.classList.add("hidden");
    questHint.textContent = step.hint;
  }

  renderDots();
  questInput?.focus();
}

function showDone() {
  questCard?.classList.add("hidden");
  questDone?.classList.remove("hidden");

  // Copy answers into existing q1..q5 if they exist (keeps your derivedPhraseFromAnswers working)
  if (q1) q1.value = wizardAnswers.q1;
  if (q2) q2.value = wizardAnswers.q2;
  if (q3) q3.value = wizardAnswers.q3;
  if (q4) q4.value = wizardAnswers.q4;
  if (q5) q5.value = wizardAnswers.q5;
}

async function isCorrectAnswer(key, typed) {
  const norm = lettersOnly(typed);
  const hash = await sha256Hex(norm);
  const okList = ANSWER_HASHES[key] || [];
  return okList.includes(hash);
}

async function submitWizard() {
  const step = WIZARD[wizardIndex];
  const typed = getVal(questInput);

  if (questError) questError.style.display = "none";
  if (questOk) questOk.style.display = "none";

  if (!typed.trim()) {
    if (questError) questError.style.display = "block";
    questCard?.classList.add("shake");
    setTimeout(() => questCard?.classList.remove("shake"), 450);
    return;
  }

  const ok = await isCorrectAnswer(step.key, typed);

  if (!ok) {
    wizardTries++;
    if (questError) questError.style.display = "block";
    questCard?.classList.add("shake");
    setTimeout(() => questCard?.classList.remove("shake"), 450);

    if (wizardTries >= 3) questHint?.classList.remove("hidden");
    return;
  }

  // Correct
  if (questOk) questOk.style.display = "block";
  wizardAnswers[step.key] = typed;

  // Envelope pulse on correct
  questEnvelope?.classList.add("pulse");
  setTimeout(() => questEnvelope?.classList.remove("pulse"), 520);

  setTimeout(() => {
    wizardIndex++;
    if (wizardIndex >= WIZARD.length) {
      showDone();
    } else {
      showQuestion();
    }
  }, 550);
}

function resetWizard() {
  wizardIndex = 0;
  wizardTries = 0;
  Object.keys(wizardAnswers).forEach((k) => (wizardAnswers[k] = ""));

  questDone?.classList.add("hidden");
  questCard?.classList.remove("hidden");
  showQuestion();
}

// Start wizard on envelope click; also allow buttons
questEnvelope?.addEventListener("click", resetWizard);
questNextBtn?.addEventListener("click", submitWizard);
questResetBtn?.addEventListener("click", resetWizard);
questInput?.addEventListener("keydown", (e) => {
  if (e.key === "Enter") submitWizard();
});

// Initial wizard view
questCard?.classList.remove("hidden");
questDone?.classList.add("hidden");
renderDots();
showQuestion();

// ---- DEV ONLY: helper to generate hashes in console ----
window.hashMe = async function (s) {
  const clean = lettersOnly(s);
  const hash = await sha256Hex(clean);
  console.log("Input:", clean);
  console.log("SHA-256:", hash);
};
