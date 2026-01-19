// envelope.js (animations only) — safe to use alongside your existing app.js

(() => {
  const sealEl = document.getElementById("seal");
  const envelopeEl = document.getElementById("envelope");
  const heartBurstEl = document.getElementById("heartBurst");
  const letterWrapEl = document.querySelector(".letterWrap");

  function explodeHeartsFromSeal() {
    if (!heartBurstEl || !sealEl) return;

    const r = sealEl.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;

    const count = 70;
    for (let i = 0; i < count; i++) {
      const h = document.createElement("div");
      h.className = "heart";
      h.textContent = Math.random() > 0.5 ? "❤️" : "💖";

      // start at seal center
      h.style.left = `${cx}px`;
      h.style.top = `${cy}px`;

      // burst directions
      const dx = Math.random() * 520 - 260;  // -260..260
      const dy = Math.random() * 520 - 260;  // -260..260
      h.style.setProperty("--x", `${dx}px`);
      h.style.setProperty("--y", `${dy}px`);

      heartBurstEl.appendChild(h);
      setTimeout(() => h.remove(), 1800);
    }
  }

  // Expose globally so app.js can call it
  window.unlockEnvelope = function unlockEnvelope() {
    // crack + split wax
    sealEl?.classList.add("fx-break");

    // open envelope (keeps your existing .open class usage)
    envelopeEl?.classList.add("open");

    // letter physically slides out (uses your existing letterWrap)
    letterWrapEl?.classList.add("fx-slide-out");

    // burst hearts
    explodeHeartsFromSeal();
  };

  // Optional: allow reset (if you want to call on reset/fail)
  window.resetEnvelopeFX = function resetEnvelopeFX() {
    sealEl?.classList.remove("fx-break");
    letterWrapEl?.classList.remove("fx-slide-out");
  };
})();
