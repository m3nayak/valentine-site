/* Envelope unlock + animation logic ONLY */

const envelopeEl = document.getElementById("envelope");
const sealEl = document.getElementById("seal");
const heartBurstEl = document.getElementById("heartBurst");

window.unlockEnvelope = function () {
  sealEl?.classList.add("break");
  envelopeEl?.classList.add("open");
  explodeHearts();
};

function explodeHearts() {
  if (!heartBurstEl) return;
  for (let i = 0; i < 60; i++) {
    const heart = document.createElement("div");
    heart.className = "heart";
    heart.textContent = Math.random() > 0.5 ? "❤️" : "💖";

    heart.style.left = "50%";
    heart.style.top = "50%";
    heart.style.setProperty("--x", `${Math.random() * 420 - 210}px`);
    heart.style.setProperty("--y", `${Math.random() * 420 - 210}px`);

    heartBurstEl.appendChild(heart);
    setTimeout(() => heart.remove(), 2000);
  }
}
