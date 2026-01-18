// app.js

// 1) Paste the SHA-256 hash (hex) of the CORRECT secret phrase here.
// You will generate it once using the Admin panel in the UI.
const CORRECT_PHRASE_HASH_HEX = "559e13c28aaac095cac0e1e2c726e6efee385ceb41536e9acd0295dfeab80802";

// Optional signature name:
const SIGNATURE_NAME = "Manju";

// Add your photos here (put them in /assets and use paths like "assets/1.jpg")
const PHOTO_URLS = [
  // Example placeholders — replace with your 40 photos
  // "assets/1.jpg",
  // "assets/2.jpg",
];

// Elements
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
function normalize(s){
  return (s || "").trim().toLowerCase();
}
function lettersOnly(s){
  return normalize(s).replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim();
}
function canonicalWord(s){
  return lettersOnly(s).replace(/\s/g, "");
}

// Most common letter from a string (letters only)
function mostCommonLetter(text){
  const t = normalize(text).replace(/[^a-z]/g, "");
  if (!t) return "";
  const freq = {};
  for (const c of t) freq[c] = (freq[c] || 0) + 1;
  return Object.keys(freq).sort((a,b) => freq[b] - freq[a])[0];
}

// Extract "rose" from second word (singularize roses->rose)
function flowerSingular(flowers){
  const parts = lettersOnly(flowers).split(" ").filter(Boolean);
  const second = parts[1] || "";
  if (!second) return "";
  if (second === "roses") return "rose";
  if (second.endsWith("s") && second.length > 3) return second.slice(0, -1);
  return second;
}

// Build the secret phrase from answers (intended to become "cupidrosela")
function derivedPhraseFromAnswers(){
  // Q1 first two letters
  const nick = canonicalWord(q1.value);
  const CU = nick.slice(0,2);

  // Q2 most common letter (Griffith/Griffiths => i)
  const I = mostCommonLetter(q2.value);

  // Q3 first letter
  const song = canonicalWord(q3.value);
  const P = song[0] || "";

  // Q5 last letter of colour + flower singular (e.g. "red roses" => d + rose)
  const parts = lettersOnly(q5.value).split(" ").filter(Boolean);
  const colour = parts[0] || "";
  const D = colour ? colour.slice(-1) : "";
  const ROSE = flowerSingular(q5.value); // "rose"

  // Q4 airport code first two letters (prefer "lax")
  const meet = canonicalWord(q4.value);
  const LA = meet.includes("lax") ? "la" : meet.slice(0,2);

  return `${CU}${I}${P}${D}${ROSE}${LA}`;
}

// SHA-256 hex
async function sha256Hex(text){
  const enc = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  const bytes = Array.from(new Uint8Array(buf));
  return bytes.map(b => b.toString(16).padStart(2, "0")).join("");
}

// UI lock/unlock
function setUnlocked(state){
  lockedOverlay.style.display = state ? "none" : "flex";
}

let failedAttempts = 0;
function updateAttemptsUI(){
  if (!attemptsText) return;

  if (failedAttempts === 0){
    attemptsText.textContent = "";
  } else {
    attemptsText.textContent = `Unlock attempts: ${failedAttempts} (hints unlock after 3)`;
  }

  if (failedAttempts >= 3){
    hintsBox?.classList.remove("hidden");
  } else {
    hintsBox?.classList.add("hidden");
  }
}

// Notify choice via Netlify Forms
async function notifyChoice(choice){
  const data = new URLSearchParams();
  data.append("form-name", "valentine-result");
  data.append("choice", choice);
  data.append("timestamp", new Date().toISOString());
  data.append("note", "Valentine site response");

  await fetch("/", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: data.toString()
  });
}

// Collage
function showCollage(){
  collageStage.innerHTML = "";
  collageOverlay.classList.add("show");

  const W = collageStage.clientWidth;
  const H = collageStage.clientHeight;

  const picks = (PHOTO_URLS.length ? PHOTO_URLS : []).slice(0, 40);
  // If no photos yet, show a friendly message instead of nothing
  if (picks.length === 0){
    const msg = document.createElement("div");
    msg.style.padding = "20px";
    msg.style.color = "white";
    msg.style.fontFamily = "system-ui, sans-serif";
    msg.textContent = "Add your photos into /assets and list them in PHOTO_URLS in app.js 💖";
    collageStage.appendChild(msg);
    return;
  }

  picks.forEach((src, i) => {
    const img = document.createElement("img");
    img.src = src;
    img.className = "collageImg";

    const x = Math.max(0, Math.floor(Math.random() * (W - 240)));
    const y = Math.max(0, Math.floor(Math.random() * (H - 240)));
    const r = `${Math.floor((Math.random() * 22) - 11)}deg`;

    img.style.left = `${x}px`;
    img.style.top = `${y}px`;
    img.style.setProperty("--r", r);
    img.style.animationDelay = `${i * 35}ms`;

    collageStage.appendChild(img);
  });
}

collageClose.addEventListener("click", () => {
  collageOverlay.classList.remove("show");
});

// NO button dodge (so he can’t click it)
function dodgeNoButton(){
  const btn = noBtn;
  const parent = btn.parentElement; // row
  const rect = parent.getBoundingClientRect();

  const dx = Math.round((Math.random() * 260) - 130);
  const dy = Math.round((Math.random() * 140) - 70);

  btn.style.transform = `translate(${dx}px, ${dy}px)`;
}

noBtn.addEventListener("mouseenter", dodgeNoButton);
noBtn.addEventListener("mousedown", (e) => { e.preventDefault(); dodgeNoButton(); });
noBtn.addEventListener("touchstart", (e) => { e.preventDefault(); dodgeNoButton(); }, { passive:false });

// YES / NO
yesBtn.addEventListener("click", async () => {
  answerArea.textContent = "You just made my whole heart smile. Happy Valentine’s Day, my love ❤️";
  showCollage();
  try { await notifyChoice("YES"); } catch(e) {}
});
noBtn.addEventListener("click", async () => {
  answerArea.textContent = "Nice try 😌";
  try { await notifyChoice("NO"); } catch(e) {}
});

// Unlock
unlockBtn.addEventListener("click", async () => {
  errorMsg.style.display = "none";
  successMsg.style.display = "none";

  const typed = canonicalWord(pw.value);
  const hash = await sha256Hex(typed);

  if (CORRECT_PHRASE_HASH_HEX !== "PASTE_HASH_HERE" && hash === CORRECT_PHRASE_HASH_HEX){
    failedAttempts = 0;
    updateAttemptsUI();

    setUnlocked(true);
    successMsg.style.display = "block";

    // cinematic reveal
    letterWrap?.classList.add("unlocked");
    envelope.classList.add("zoom");
    envelope.classList.add("open");

    setTimeout(() => {
      scroll.classList.remove("hidden");
      scroll.scrollTop = 0;
    }, 900);
  } else {
    failedAttempts++;
    updateAttemptsUI();

    setUnlocked(false);
    errorMsg.style.display = "block";

    letterWrap?.classList.remove("unlocked");
    envelope.classList.remove("zoom");
    envelope.classList.remove("open");
    scroll.classList.add("hidden");
  }
});

// Reset
resetBtn.addEventListener("click", () => {
  q1.value = ""; q2.value = ""; q3.value = ""; q4.value = ""; q5.value = "";
  pw.value = "";
  errorMsg.style.display = "none";
  successMsg.style.display = "none";
  setUnlocked(false);

  failedAttempts = 0;
  updateAttemptsUI();

  letterWrap?.classList.remove("unlocked");
  envelope.classList.remove("zoom");
  envelope.classList.remove("open");
  scroll.classList.add("hidden");
});

// Admin: generate hash for the CORRECT phrase
genHashBtn.addEventListener("click", async () => {
  // Optionally show what the answers would derive (for your own checking)
  const derived = derivedPhraseFromAnswers();
  const derivedHash = await sha256Hex(derived);

  const typed = canonicalWord(pw.value);
  const typedHash = typed ? await sha256Hex(typed) : "";

  hashOut.textContent =
    `Derived from answers: ${derived}\n` +
    `SHA-256(derived): ${derivedHash}\n\n` +
    (typed ? `Typed phrase: ${typed}\nSHA-256(typed): ${typedHash}\n\n` : "") +
    `Paste SHA-256(typed) if your typed phrase is the correct one.\n` +
    `Or paste SHA-256(derived) if you want the answers to auto-derive the correct phrase.`;
});

// Date + signature
dateStamp.textContent = new Date().toLocaleDateString(undefined, { year:"numeric", month:"long", day:"numeric" });
sig.textContent = `— Yours, ${SIGNATURE_NAME}`;

// Initial state
scroll.classList.add("hidden");
envelope.classList.remove("zoom");
envelope.classList.remove("open");
setUnlocked(false);
updateAttemptsUI();

// app.js — replace ONLY the existing heartsBackground IIFE at the bottom
// (the part that starts with: (function heartsBackground(){ ... })();
// Replace it with this one:

(function softLuxeConfetti(){
  const canvas = document.getElementById("heartsCanvas");
  if(!canvas) return;
  const ctx = canvas.getContext("2d");

  let W = 0, H = 0;
  function resize(){
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W * devicePixelRatio;
    canvas.height = H * devicePixelRatio;
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0);
  }
  window.addEventListener("resize", resize);
  resize();

  // Soft luxe tuning
  const MAX_PARTICLES = 56;      // keep it subtle
  const KISS_RATE = 0.16;        // ~16% are 💋
  const GRAVITY = 0.035;         // gentle acceleration
  const WIND = 0.18;             // slow drift
  const FLOOR_PADDING = 8;

  // Accumulation (pile) — will slowly rise up to a cap
  let pile = {
    height: 0,
    cap: Math.max(60, Math.min(220, Math.round(H * 0.18))), // ~18% of screen height max
    density: 1.0
  };

  function rand(a,b){ return a + Math.random() * (b-a); }

  function makeParticle(){
    const isKiss = Math.random() < KISS_RATE;
    const size = isKiss ? rand(12, 22) : rand(10, 20);
    return {
      t: isKiss ? "kiss" : "heart",
      x: rand(0, W),
      y: rand(-H, 0),
      vx: rand(-0.25, 0.25),
      vy: rand(0.35, 1.05),
      r: rand(-Math.PI, Math.PI),
      vr: rand(-0.008, 0.008),
      s: size,
      a: rand(0.18, 0.38),         // low alpha = luxe
      wob: rand(0.6, 1.6),
      wobPhase: rand(0, 1000),
      landed: false,
      // landed position in pile band
      lx: 0,
      ly: 0,
      lr: 0,
      la: 0
    };
  }

  const particles = Array.from({length: MAX_PARTICLES}, makeParticle);
  const landed = []; // we keep a rolling list of landed particles to draw the pile

  function drawHeart(x,y,scale,rot,alpha){
    ctx.save();
    ctx.translate(x,y);
    ctx.rotate(rot);
    ctx.globalAlpha = alpha;

    // Heart fill: pink + red overlay, subtle
    ctx.fillStyle = "rgba(255, 105, 180, 0.55)";
    ctx.beginPath();
    const s = 8.8 * scale;
    ctx.moveTo(0, -s/2);
    ctx.bezierCurveTo(-s, -s*1.35, -s*2.15, -s*0.15, 0, s*1.65);
    ctx.bezierCurveTo(s*2.15, -s*0.15, s, -s*1.35, 0, -s/2);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "rgba(255, 0, 80, 0.16)";
    ctx.fill();

    ctx.restore();
  }

  function drawKiss(x,y,size,rot,alpha){
    ctx.save();
    ctx.translate(x,y);
    ctx.rotate(rot);
    ctx.globalAlpha = alpha;
    ctx.font = `${Math.round(size)}px ui-sans-serif, system-ui`;
    ctx.fillText("💋", -size*0.55, size*0.55);
    ctx.restore();
  }

  function floorY(){
    return H - FLOOR_PADDING - pile.height;
  }

  function landParticle(p){
    p.landed = true;
    p.lx = p.x;
    // Place within the pile band
    const bandTop = H - FLOOR_PADDING - Math.max(18, pile.height);
    const bandBottom = H - FLOOR_PADDING;
    p.ly = rand(bandTop, bandBottom);
    p.lr = rand(-0.35, 0.35);
    p.la = rand(0.10, 0.22); // even more subtle in the pile
    landed.push(p);

    // keep pile list bounded so it doesn't get heavy
    while (landed.length > 220) landed.shift();

    // gently increase pile height up to cap
    pile.height = Math.min(pile.cap, pile.height + rand(0.35, 1.15));
  }

  function drawPile(){
    if (landed.length === 0) return;

    // faint “mist” band to unify the pile visually (very soft)
    ctx.save();
    ctx.globalAlpha = 0.10;
    ctx.fillStyle = "rgba(255, 105, 180, 0.40)";
    const y0 = H - FLOOR_PADDING - pile.height;
    ctx.fillRect(0, y0, W, pile.height + FLOOR_PADDING);
    ctx.restore();

    // draw landed particles
    for (const p of landed){
      if (p.t === "kiss"){
        drawKiss(p.lx, p.ly, p.s, p.lr, p.la);
      } else {
        drawHeart(p.lx, p.ly, p.s/16, p.lr, p.la);
      }
    }
  }

  function resetFalling(p){
    p.t = (Math.random() < KISS_RATE) ? "kiss" : "heart";
    p.x = rand(0, W);
    p.y = rand(-120, -20);
    p.vx = rand(-0.25, 0.25);
    p.vy = rand(0.35, 1.05);
    p.r = rand(-Math.PI, Math.PI);
    p.vr = rand(-0.008, 0.008);
    p.s = (p.t === "kiss") ? rand(12, 22) : rand(10, 20);
    p.a = rand(0.18, 0.38);
    p.wob = rand(0.6, 1.6);
    p.wobPhase = rand(0, 1000);
    p.landed = false;
  }

  function tick(){
    ctx.clearRect(0,0,W,H);

    // draw pile behind falling particles (so it feels like background)
    drawPile();

    const fy = floorY();

    for (const p of particles){
      if (p.landed) continue;

      // motion
      p.wobPhase += 0.012 * p.wob;
      const drift = Math.sin(p.wobPhase) * WIND;

      p.vy += GRAVITY;
      p.x += p.vx + drift;
      p.y += p.vy;
      p.r += p.vr;

      // wrap horizontally
      if (p.x < -40) p.x = W + 40;
      if (p.x > W + 40) p.x = -40;

      // draw
      if (p.t === "kiss"){
        drawKiss(p.x, p.y, p.s, p.r, p.a);
      } else {
        drawHeart(p.x, p.y, p.s/16, p.r, p.a);
      }

      // land into pile band when reaching the floor line
      if (p.y >= fy){
        landParticle(p);
        // recycle the falling particle as a new one
        resetFalling(p);
      }
    }

    requestAnimationFrame(tick);
  }

  tick();
})();


