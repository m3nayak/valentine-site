/* ============================================================
   Responsive background: Hearts canvas + Kiss popups
   - Adapts particle count and kiss rate to viewport size
   - Handles resize/orientation changes
   - Honors prefers-reduced-motion
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

  const COLORS = [
    "rgba(255, 230, 240, 0.85)",
    "rgba(255, 170, 210, 0.88)",
    "rgba(255, 105, 180, 0.92)",
    "rgba(255, 20, 147, 0.92)",
    "rgba(255, 45, 85, 0.92)",
    "rgba(220, 20, 60, 0.92)",
  ];

  function desiredCount() {
    // Scale with viewport area, clamp for performance.
    const area = W * H;
    // baseline tuned for ~1920x1080
    const base = 200;
    const scale = area / (1920 * 1080);
    const count = Math.round(base * scale);

    // small phones get fewer; big screens get more (but capped)
    return clamp(count, 60, 260);
  }

  function resize() {
    W = window.innerWidth;
    H = window.innerHeight;
    dpr = window.devicePixelRatio || 1;

    canvas.width = Math.floor(W * dpr);
    canvas.height = Math.floor(H * dpr);
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Rebuild particles to match new screen size
    buildHearts();
  }

  function buildHearts() {
    const COUNT = prefersReducedMotion ? 0 : desiredCount();
    hearts = Array.from({ length: COUNT }).map(() => ({
      x: rand(0, W),
      y: rand(0, H),
      s: rand(0.7, 1.55),
      v: rand(0.35, 1.05),
      vx: rand(-0.25, 0.25),
      r: rand(-Math.PI, Math.PI),
      vr: rand(-0.006, 0.006),
      wob: rand(0.6, 1.6),
      wobPhase: rand(0, 1000),
      a: rand(0.16, 0.30),
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
    }));
  }

  // Draw a heart using bezier curves
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

    // subtle outline
    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.restore();
  }

  let rafId = null;
  function tick() {
    ctx.clearRect(0, 0, W, H);

    if (hearts.length) {
      const WIND = 0.28;

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
          h.v = rand(0.35, 1.05);
          h.vx = rand(-0.25, 0.25);
          h.s = rand(0.7, 1.55);
          h.a = rand(0.16, 0.30);
          h.color = COLORS[Math.floor(Math.random() * COLORS.length)];
        }

        drawHeart(h.x, h.y, h.s, h.r, h.a, h.color);
      }
    }

    rafId = requestAnimationFrame(tick);
  }

  // Debounced resize to avoid “resize storms”
  let resizeTimer = null;
  function onResize() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 120);
  }

  window.addEventListener("resize", onResize, { passive: true });
  window.addEventListener("orientationchange", onResize, { passive: true });

  resize();
  tick();

  // Optional: stop animation if tab hidden (saves battery)
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = null;
    } else if (!rafId) {
      tick();
    }
  });
})();


/* ============================================================
   KISS POPUPS
   Put kiss.png in same folder, or change path.
============================================================ */
(function kissPopups() {
  const layer = document.getElementById("kissLayer");
  if (!layer) return;

  if (prefersReducedMotion) return;

  const KISS_IMG_URLS = ["kiss.png"]; // update if needed

  function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function viewportTuning() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const area = w * h;

    // Scale max on-screen and size to viewport:
    const maxOnScreen = clamp(Math.round(area / (320 * 480) * 6), 4, 12);
    const minSize = clamp(Math.round(Math.min(w, h) * 0.10), 48, 90);
    const maxSize = clamp(Math.round(Math.min(w, h) * 0.22), 90, 160);

    // Spawn frequency: smaller screens slightly slower
    const minMs = clamp(Math.round(1100 - (area / (1920 * 1080)) * 250), 850, 1400);
    const maxMs = clamp(Math.round(2000 - (area / (1920 * 1080)) * 450), 1200, 2600);

    return { maxOnScreen, minSize, maxSize, minMs, maxMs };
  }

  function spawn() {
    const { maxOnScreen, minSize, maxSize } = viewportTuning();
    if (layer.childElementCount >= maxOnScreen) return;

    const el = document.createElement("div");
    el.className = "kissPop";

    const size = Math.round(rand(minSize, maxSize));
    const rot = Math.round(rand(-18, 18));
    const dur = Math.round(rand(5200, 9000));
    const op = rand(0.10, 0.22).toFixed(2);

    const margin = 18;
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
    setTimeout(() => el.remove(), dur + 250);
  }

  function loop() {
    const { minMs, maxMs } = viewportTuning();
    spawn();
    const next = Math.round(rand(minMs, maxMs));
    setTimeout(loop, next);
  }

  // clear and restart on resize (optional, keeps it tidy)
  let restartTimer = null;
  window.addEventListener("resize", () => {
    clearTimeout(restartTimer);
    restartTimer = setTimeout(() => {
      // remove any existing kisses so positions don't feel weird after resize
      layer.innerHTML = "";
    }, 200);
  }, { passive: true });

  loop();
})();
