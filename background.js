/* ============================================================
   BACKGROUND: SOFT LUXE HEARTS (canvas)
============================================================ */
(function softLuxeHeartsOnly() {
  const canvas = document.getElementById("heartsCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  let W = 0, H = 0;

  function resize() {
    W = window.innerWidth;
    H = window.innerHeight;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(W * dpr);
    canvas.height = Math.floor(H * dpr);
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
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

    // Simple bezier heart
    ctx.moveTo(0, -s / 2);
    ctx.bezierCurveTo(-s, -s * 1.35, -s * 2.15, -s * 0.15, 0, s * 1.65);
    ctx.bezierCurveTo(s * 2.15, -s * 0.15, s, -s * 1.35, 0, -s / 2);

    ctx.closePath();
    ctx.fill();

    // subtle highlight/outline
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


/* ============================================================
   BACKGROUND: LIPSTICK KISS POPUPS
   Put kiss.png in same folder (or update path below)
============================================================ */
(function lipstickKissPopups() {
  const layer = document.getElementById("kissLayer");
  if (!layer) return;

  // ✅ Put your file at: ./kiss.png (same folder as index.html)
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
