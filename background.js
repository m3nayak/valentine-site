/* ============================================================
   Responsive romantic background (NO dead zones on resize)
   - Hearts canvas fills immediately on resize/maximise
   - Kiss popups reseed instantly
   - Safe on mobile, tiny windows, large screens
============================================================ */

const prefersReducedMotion =
  window.matchMedia &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

function rand(a, b) {
  return a + Math.random() * (b - a);
}

/* ============================================================
   HEARTS CANVAS
============================================================ */
(function heartsBackground() {
  const canvas = document.getElementById("heartsCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  let W = 0, H = 0, dpr = 1;
  let hearts = [];
  let rafId = null;

  const COLORS = [
    "rgba(255, 230, 240, 0.85)",
    "rgba(255, 170, 210, 0.88)",
    "rgba(255, 105, 180, 0.92)",
    "rgba(255, 20, 147, 0.92)",
    "rgba(255, 45, 85, 0.92)",
    "rgba(220, 20, 60, 0.92)",
  ];

  function desiredCount() {
    const area = W * H;
    const base = 200; // tuned for 1920x1080
    const scale = area / (1920 * 1080);
    return clamp(Math.round(base * scale), 80, 280);
  }

  function createHeart(x = rand(0, W), y = rand(0, H)) {
    return {
      x,
      y,
      s: rand(0.7, 1.6),
      v: rand(0.35, 1.05),
      vx: rand(-0.25, 0.25),
      r: rand(-Math.PI, Math.PI),
      vr: rand(-0.006, 0.006),
      wob: rand(0.6, 1.6),
      wobPhase: rand(0, 1000),
      a: rand(0.16, 0.30),
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
    };
  }

  function rebuildHeartsInstantly() {
    if (prefersReducedMotion) {
      hearts = [];
      return;
    }

    const count = desiredCount();
    hearts = Array.from({ length: count }, () => createHeart());
  }

  function resizeCanvas() {
    W = window.innerWidth;
    H = window.innerHeight;
    dpr = window.devicePixelRatio || 1;

    canvas.width = Math.floor(W * dpr);
    canvas.height = Math.floor(H * dpr);
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // 🔥 KEY FIX: immediately repopulate whole screen
    rebuildHeartsInstantly();
  }

  function drawHeart(h) {
    ctx.save();
    ctx.translate(h.x, h.y);
    ctx.rotate(h.r);
    ctx.globalAlpha = h.a;

    ctx.fillStyle = h.color;
    ctx.beginPath();
    const s = 10 * h.s;
    ctx.moveTo(0, -s / 2);
    ctx.bezierCurveTo(-s, -s * 1.35, -s * 2.15, -s * 0.15, 0, s * 1.65);
    ctx.bezierCurveTo(s * 2.15, -s * 0.15, s, -s * 1.35, 0, -s / 2);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  }

  function tick() {
    ctx.clearRect(0, 0, W, H);

    const WIND = 0.28;
    for (const h of hearts) {
      h.wobPhase += 0.012 * h.wob;
      h.x += h.vx + Math.sin(h.wobPhase) * WIND;
      h.y += h.v;
      h.r += h.vr;

      if (h.x < -40) h.x = W + 40;
      if (h.x > W + 40) h.x = -40;

      if (h.y > H + 60) {
        h.x = rand(0, W);
        h.y = -60;
      }

      drawHeart(h);
    }

    rafId = requestAnimationFrame(tick);
  }

  let resizeTimer = null;
  function onResize() {
    clearT
