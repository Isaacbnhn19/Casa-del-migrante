(() => {
  const track = document.querySelector(".carTrack");
  const slides = Array.from(document.querySelectorAll(".carSlide"));
  const dotsWrap = document.querySelector(".carDots");
  const prev = document.querySelector(".carBtn.prev");
  const next = document.querySelector(".carBtn.next");

  if (!track || slides.length === 0 || !dotsWrap) return;

  let index = 0;
  let timer = null;

  function renderDots() {
    dotsWrap.innerHTML = "";
    slides.forEach((_, i) => {
      const b = document.createElement("button");
      b.className = "dot" + (i === index ? " active" : "");
      b.type = "button";
      b.addEventListener("click", () => goTo(i, true));
      dotsWrap.appendChild(b);
    });
  }

  function update() {
    track.style.transform = `translateX(${-index * 100}%)`;
    renderDots();
  }

  function goTo(i, userAction = false) {
    index = (i + slides.length) % slides.length;
    update();
    if (userAction) restartAuto();
  }

  function restartAuto() {
    if (timer) clearInterval(timer);
    timer = setInterval(() => goTo(index + 1), 5500);
  }

  prev?.addEventListener("click", () => goTo(index - 1, true));
  next?.addEventListener("click", () => goTo(index + 1, true));

  // Pausa al hover (pro)
  const carousel = document.querySelector(".carousel");
  carousel?.addEventListener("mouseenter", () => timer && clearInterval(timer));
  carousel?.addEventListener("mouseleave", restartAuto);

  update();
  restartAuto();
})();

// ===== Contadores + barras animadas (Impacto en cifras) =====
(() => {
  const formatMX = (n) => n.toLocaleString("es-MX");

  // Animación de números (0 → target)
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

  // Animación de barras (0% → target%)
  function animateBar(el, targetPct, duration = 900) {
    const start = 0;
    const startTime = performance.now();

    function tick(now) {
      const t = Math.min(1, (now - startTime) / duration);
      const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
      const value = start + (targetPct - start) * eased;

      el.style.width = `${value}%`;

      if (t < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }

  function runOnce() {
    // ===== NÚMEROS =====
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

    // ===== BARRAS =====
    const bars = document.querySelectorAll(".barAnim");
    bars.forEach((bar, idx) => {
      if (bar.dataset.done === "1") return;

      const pct = Number(bar.dataset.bar || "0");
      bar.dataset.done = "1";

      // Animación escalonada (se ve más pro)
      setTimeout(() => {
        animateBar(bar, pct, 900);
      }, idx * 90);
    });
  }

  // Ejecutar cuando la sección entre en pantalla
  // (sin depender de :has para compatibilidad)
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
})();

// ===== Año dinámico (footer) =====
(() => {
  const y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();
})();

// ===== Desactivar clic en menús padre (solo hover) =====
document.addEventListener("DOMContentLoaded", () => {
  const disableLinks = [
    "Conócenos",
    "Ayúdanos a ayudar",
    "Actualidad"
  ];

  document.querySelectorAll("nav a").forEach(link => {
    if (disableLinks.includes(link.textContent.trim())) {
      link.addEventListener("click", e => {
        e.preventDefault();
      });
    }
  });
});
