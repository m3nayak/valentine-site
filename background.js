/* ============================================================
   Responsive romantic background (NO dead zones on resize)
   - Hearts: immediately seed into newly revealed area on resize/maximize
   - Kisses: instantly reseed
   - Works on mobile rotation, tiny windows, maximize/minimize
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
   HEARTS CANVAS (instant fill on resize)
============================================================ */
(function heartsBackground() {
  const canvas = document.getElementById("heartsCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  let W = 0, H = 0, dpr = 1;
  let prevW = 0, prevH = 0;
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

  function desiredCount(w, h) {
    const area = w * h;
    const base = 200; // tuned for 1920x1080
    const scale = area / (1920 * 1080);
    return clamp(Math.round(base * scale), 80, 300);
  }

  function createHeart(x, y) {
    return {
      x: x ?? rand(0, W),
      y: y ?? rand(0, H),
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

  function setCanvasSize() {
    prevW = W;
    prevH = H;

    W = window.innerWidth;
    H = window.innerHeight;
    dpr = window.devicePixelRatio || 1;

    canvas.width = Math.floor(W * dpr);
    canvas.height = Math.floor(H * dpr);
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function seedNewAreaImmediately() {
    if (prefersReducedMotion) {
      hearts = [];
      return;
    }

    const target = desiredCount(W, H);

    // If first run or huge jump, just rebuild fully.
    if (hearts.length === 0 || prevW === 0 || prevH === 0) {
      hearts = Array.from({ length: target }, () => createHeart());
      return;
    }

    // Add hearts specifically in newly revealed areas (right side / bottom)
    const added = [];

    // New right-side strip (when width increases)
    if (W > prevW) {
      const stripW = W - prevW;
      const n = clamp(Math.round((stripW * H) / (W * H) * target), 8, 90);
      for (let i = 0; i < n; i++) {
        added.push(createHeart(rand(prevW, W), rand(0, H)));
      }
    }

    // New bottom strip (when height increases)
    if (H > prevH) {
      const stripH = H - prevH;
      const n = clamp(Math.round((prevW * stripH) / (W * H) * target), 8, 90);
      for (let i = 0; i < n; i++) {
        added.push(createHeart(rand(0, Math.min(prevW, W)), rand(prevH, H)));
      }
    }

    // If it shrank, wrap hearts that are out of bounds back into bounds
    for (const h of hearts) {
      if (h.x > W) h.x = rand(0, W);
      if (h.y > H) h.y = rand(0, H);
    }

    hearts.push(...added);

    // Ensure count matches target (top up or trim)
    if (hearts.length < target) {
      const need = target - hearts.length;
      for (let i = 0; i < need; i++) hearts.push(createHeart());
    } else if (hearts.length > target) {
      hearts.length = target;
    }
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

  function renderOnce() {
    ctx.clearRect(0, 0, W, H);
    for (const h of hearts) drawHeart(h);
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

  // Resize handling: run immediately (rAF-throttled), no “waiting”
  let resizeQueued = false;
  function requestResize() {
    if (resizeQueued) return;
    resizeQueued = true;

    requestAnimationFrame(() => {
      resizeQueued = false;
      setCanvasSize();
      seedNewAreaImmediately();
      renderOnce(); // immediate visual fill (prevents blank zones)
    });
  }

  window.addEventListener("resize", requestResize, { passive: true });
  window.addEventListener("orientationchange", requestResize, { passive: true });

  // init
  setCanvasSize();
  seedNewAreaImmediately();
  renderOnce();
  tick();

  // Pause when tab hidden (battery friendly)
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    } else if (!rafId) {
      tick();
    }
  });
})();

/* ============================================================
   KISS POPUPS (instant reseed on resize)
============================================================ */
(function kissPopups() {
  const layer = document.getElementById("kissLayer");
  if (!layer || prefersReducedMotion) return;

  const KISS_IMG_URLS = ["kiss.png"]; // put kiss.png next to index.html

  function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function tuning() {
    const area = window.innerWidth * window.innerHeight;
    return {
      max: clamp(Math.round(area / (320 * 480) * 6), 4, 14),
      minSize: clamp(Math.round(Math.min(window.innerWidth, window.innerHeight) * 0.12), 48, 90),
      maxSize: clamp(Math.round(Math.min(window.innerWidth, window.innerHeight) * 0.24), 90, 160),
      minMs: 900,
      maxMs: 1800,
    };
  }

  function spawn(force = false) {
    const t = tuning();
    if (!force && layer.childElementCount >= t.max) return;

    const el = document.createElement("div");
    el.className = "kissPop";

    const size = rand(t.minSize, t.maxSize);
    el.style.left = rand(20, window.innerWidth - size - 20) + "px";
    el.style.top = rand(20, window.innerHeight - size - 20) + "px";

    el.style.setProperty("--size", `${size}px`);
    el.style.setProperty("--rot", `${rand(-18, 18)}deg`);
    el.style.setProperty("--dur", `${rand(5200, 9000)}ms`);
    el.style.setProperty("--op", rand(0.12, 0.22).toFixed(2));
    el.style.setProperty("--img", `url("${pick(KISS_IMG_URLS)}")`);

    layer.appendChild(el);
    setTimeout(() => el.remove(), 9500);
  }

  function reseedImmediately() {
    layer.innerHTML = "";
    const { max } = tuning();
    for (let i = 0; i < Math.min(4, max); i++) spawn(true);
  }

  function loop() {
    spawn();
    const { minMs, maxMs } = tuning();
    setTimeout(loop, rand(minMs, maxMs));
  }

  window.addEventListener("resize", () => {
    clearTimeout(window.__kissResize);
    window.__kissResize = setTimeout(reseedImmediately, 120);
  }, { passive: true });

  reseedImmediately();
  loop();
})();
