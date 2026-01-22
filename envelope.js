// envelope.js
// Just a gentle old-school "alive" feel

(function () {
  const env = document.getElementById("envelope");
  if (!env) return;

  let t = 0;

  function animate() {
    t += 0.01;
    const float = Math.sin(t) * 2;
    const rot = Math.sin(t * 0.6) * 0.4;

    env.style.transform = `translateY(${float}px) rotate(${rot}deg)`;
    requestAnimationFrame(animate);
  }

  animate();
})();
