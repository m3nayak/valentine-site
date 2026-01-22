// envelope.js
// Animation disabled for visibility debugging

(() => {
  const env = document.getElementById("envelope");
  if (!env) return;

  // Gentle micro-breathing only
  let t = 0;
  function breathe() {
    t += 0.01;
    const y = Math.sin(t) * 1.5;
    env.style.transform = `translateY(${y}px)`;
    requestAnimationFrame(breathe);
  }

  breathe();
})();
