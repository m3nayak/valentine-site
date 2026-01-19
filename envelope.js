/* Envelope unlock + animation logic ONLY */

const seal = document.getElementById("seal");
const envelope = document.getElementById("envelope");
const heartBurst = document.getElementById("heartBurst");

function unlockEnvelope() {
  seal.classList.add("break");
  envelope.classList.add("open");
  explodeHearts();
}

function explodeHearts() {
  for (let i = 0; i < 60; i++) {
    const heart = document.createElement("div");
    heart.classList.add("heart");
    heart.innerText = Math.random() > 0.5 ? "❤️" : "💖";

    heart.style.left = "50%";
    heart.style.top = "50%";
    heart.style.setProperty("--x", `${Math.random() * 400 - 200}px`);
    heart.style.setProperty("--y", `${Math.random() * 400 - 200}px`);

    heartBurst.appendChild(heart);
    setTimeout(() => heart.remove(), 2000);
  }
}
