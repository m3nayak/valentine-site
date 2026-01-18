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

(function softLuxeHeartsAndKisses3D(){
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

  function rand(a,b){ return a + Math.random() * (b-a); }
  function pick(arr){ return arr[Math.floor(Math.random() * arr.length)]; }
  function clamp(x,a,b){ return Math.max(a, Math.min(b, x)); }

  // --- Tune these ---
  const HEART_COUNT = 78;
  const KISS_COUNT  = 20;     // less frequent than hearts
  const WIND_BASE = 0.26;     // base wobble

  const HEART_COLORS = [
    "rgba(255, 230, 240, 0.90)",
    "rgba(255, 170, 210, 0.92)",
    "rgba(255, 105, 180, 0.96)",
    "rgba(255, 20, 147, 0.96)",
    "rgba(255, 45, 85, 0.96)",
    "rgba(220, 20, 60, 0.96)"
  ];

  // Load kiss image (root: kiss.png)
  const kissImg = new Image();
  kissImg.src = "kiss.png";
  let kissReady = false;
  kissImg.onload = () => { kissReady = true; };

  // Depth helpers:
  // z in [0..1]: 0 = far, 1 = near
  // Near objects: bigger, faster, more opaque, sharper
  function depthScale(z){ return 0.55 + z * 1.05; }            // 0.55..1.60
  function depthAlpha(z){ return 0.10 + z * 0.26; }            // 0.10..0.36 (then we tweak per type)
  function depthBlur(z){ return (1 - z) * 2.2; }               // far blur
  function depthFallSpeed(z){ return 0.20 + z * 1.15; }        // multiplier
  function depthSideSpeed(z){ return 0.10 + z * 0.65; }        // multiplier

  const particles = [];

  function makeCommon(){
    const z = rand(0.10, 1.0); // avoid ultra-far invisibles
    return {
      x: rand(0, W),
      y: rand(0, H),
      z,
      vx: rand(-0.45, 0.45) * depthSideSpeed(z),
      r: rand(-Math.PI, Math.PI),
      vr: rand(-0.010, 0.010) * (0.4 + z),
      wob: rand(0.6, 2.4),
      wobPhase: rand(0, 1000)
    };
  }

  function makeHeart(){
    const c = makeCommon();
    return {
      ...c,
      t: "heart",
      baseS: rand(0.65, 1.45),     // base size before depth scaling
      v: rand(0.35, 1.05) * depthFallSpeed(c.z),
      color: pick(HEART_COLORS),
      a: depthAlpha(c.z) + 0.05    // a bit stronger than kisses
    };
  }

  function makeKiss(){
    const c = makeCommon();
    return {
      ...c,
      t: "kiss",
      baseSize: rand(22, 40),      // base kiss size before depth scaling
      v: rand(0.25, 0.85) * depthFallSpeed(c.z),
      // kisses are luxe + subtle
      a: clamp(depthAlpha(c.z) - 0.04, 0.08, 0.22)
    };
  }

  for(let i=0;i<HEART_COUNT;i++) particles.push(makeHeart());
  for(let i=0;i<KISS_COUNT;i++)  particles.push(makeKiss());

  function drawHeart(h){
    ctx.save();
    ctx.translate(h.x, h.y);
    ctx.rotate(h.r);

    const s3d = h.baseS * depthScale(h.z);
    ctx.globalAlpha = clamp(h.a, 0.10, 0.45);

    // 3D feel: far = slightly blurrier
    ctx.filter = `blur(${depthBlur(h.z)}px)`;

    ctx.fillStyle = h.color;
    ctx.beginPath();
    const s = 10 * s3d;
    ctx.moveTo(0, -s/2);
    ctx.bezierCurveTo(-s, -s*1.35, -s*2.15, -s*0.15, 0, s*1.65);
    ctx.bezierCurveTo(s*2.15, -s*0.15, s, -s*1.35, 0, -s/2);
    ctx.closePath();
    ctx.fill();

    // near hearts get a crisper highlight
    const edge = 0.08 + h.z * 0.12;
    ctx.strokeStyle = `rgba(255,255,255,${edge.toFixed(3)})`;
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.restore();
  }

  function drawKiss(k){
    if(!kissReady) return;
    ctx.save();
    ctx.translate(k.x, k.y);
    ctx.rotate(k.r);

    // size + opacity based on depth
    const scale = depthScale(k.z);
    const w = (k.baseSize * 1.65) * scale;
    const h = (k.baseSize * 1.00) * scale;

    ctx.globalAlpha = clamp(k.a, 0.08, 0.28);
    ctx.filter = `blur(${depthBlur(k.z)}px)`;

    // a subtle “ink” vibe: far kisses blend more
    // (no blend mode needed; canvas filter + alpha gives a clean look)
    ctx.drawImage(kissImg, -w/2, -h/2, w, h);

    ctx.restore();
  }

  function reset(p){
    p.x = rand(0, W);
    p.y = rand(-100, -20);
    p.z = rand(0.10, 1.0);
    p.vx = rand(-0.45, 0.45) * depthSideSpeed(p.z);
    p.r = rand(-Math.PI, Math.PI);
    p.vr = rand(-0.010, 0.010) * (0.4 + p.z);
    p.wob = rand(0.6, 2.4);
    p.wobPhase = rand(0, 1000);

    if(p.t === "heart"){
      p.baseS = rand(0.65, 1.45);
      p.v = rand(0.35, 1.05) * depthFallSpeed(p.z);
      p.color = pick(HEART_COLORS);
      p.a = depthAlpha(p.z) + 0.05;
    } else {
      p.baseSize = rand(22, 40);
      p.v = rand(0.25, 0.85) * depthFallSpeed(p.z);
      p.a = clamp(depthAlpha(p.z) - 0.04, 0.08, 0.22);
    }
  }

  function tick(){
    ctx.clearRect(0,0,W,H);

    // draw far -> near so near particles appear on top (more 3D)
    const sorted = particles.slice().sort((a,b) => a.z - b.z);

    for(const p of sorted){
      p.wobPhase += 0.012 * p.wob;
      const drift = Math.sin(p.wobPhase) * WIND_BASE * depthSideSpeed(p.z);

      p.x += p.vx + drift;
      p.y += p.v;
      p.r += p.vr;

      if(p.x < -120) p.x = W + 120;
      if(p.x > W + 120) p.x = -120;

      if(p.y > H + 140){
        reset(p);
      }

      if(p.t === "heart") drawHeart(p);
      else drawKiss(p);
    }

    requestAnimationFrame(tick);
  }

  tick();
})();
