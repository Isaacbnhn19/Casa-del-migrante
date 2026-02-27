/* 20-stats-anim.js
   Animación de números (countUp/countUpInline) y barras (barAnim).
   - Se ejecuta una sola vez al entrar la sección en pantalla.
*/

document.addEventListener("DOMContentLoaded", () => {
  const formatMX = (n) => n.toLocaleString("es-MX");

  function animateCount(el, target, duration = 1100) {
    const start = 0;
    const startTime = performance.now();

    function tick(now) {
      const t = Math.min(1, (now - startTime) / duration);
      const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
      const value = Math.round(start + (target - start) * eased);
      el.textContent = formatMX(value);
      if (t < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }

  function animateBar(el, targetPct, duration = 900) {
    const start = 0;
    const startTime = performance.now();

    function tick(now) {
      const t = Math.min(1, (now - startTime) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const value = start + (targetPct - start) * eased;
      el.style.width = `${value}%`;
      if (t < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }

  function runOnce() {
    // NÚMEROS
    const blocks = [
      ...document.querySelectorAll(".countUp"),
      ...document.querySelectorAll(".countUpInline"),
    ];

    blocks.forEach((el) => {
      if (el.dataset.done === "1") return;
      const target = Number(el.dataset.count || "0");
      el.dataset.done = "1";
      animateCount(el, target, 1100);
    });

    // BARRAS
    const bars = document.querySelectorAll(".barAnim");
    bars.forEach((bar, idx) => {
      if (bar.dataset.done === "1") return;

      const pct = Number(bar.dataset.bar || "0");
      bar.dataset.done = "1";

      // delay escalonado
      setTimeout(() => animateBar(bar, pct, 900), idx * 90);
    });
  }

  const watchTarget = document.querySelector(".statsGrid")?.closest("section");
  if (!watchTarget) return;

  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          runOnce();
          io.disconnect();
          break;
        }
      }
    },
    { threshold: 0.25 }
  );

  io.observe(watchTarget);
});