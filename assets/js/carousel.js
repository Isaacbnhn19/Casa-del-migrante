/* 10-carousel.js
   Carrusel de “Actualidad”
   - Dots se crean una vez.
   - Botones prev/next.
   - Auto-play y pausa al hover.
*/

document.addEventListener("DOMContentLoaded", () => {
  const track = document.querySelector(".carTrack");
  const slides = Array.from(document.querySelectorAll(".carSlide"));
  const dotsWrap = document.querySelector(".carDots");
  const prev = document.querySelector(".carBtn.prev");
  const next = document.querySelector(".carBtn.next");
  const carousel = document.querySelector(".carousel");

  if (!track || slides.length === 0 || !dotsWrap) return;

  let index = 0;
  let timer = null;
  const dots = [];

  function setActiveDot() {
    dots.forEach((d, i) => d.classList.toggle("active", i === index));
  }

  function update() {
    track.style.transform = `translateX(${-index * 100}%)`;
    setActiveDot();
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

  // Crear dots 1 sola vez
  dotsWrap.innerHTML = "";
  slides.forEach((_, i) => {
    const b = document.createElement("button");
    b.className = "dot";
    b.type = "button";
    b.addEventListener("click", () => goTo(i, true));
    dotsWrap.appendChild(b);
    dots.push(b);
  });

  // Botones
  prev?.addEventListener("click", () => goTo(index - 1, true));
  next?.addEventListener("click", () => goTo(index + 1, true));

  // Pausa al hover
  carousel?.addEventListener("mouseenter", () => timer && clearInterval(timer));
  carousel?.addEventListener("mouseleave", restartAuto);

  // Init
  update();
  restartAuto();
});