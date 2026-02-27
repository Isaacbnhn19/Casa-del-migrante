/* =========================================================
   Galería de fotos (secciones + grid + lightbox con zoom)
   - Las secciones y conteos vienen de tu requerimiento
   - Las rutas de imágenes son locales (assets/img/galeria/...)
   - Si una imagen no existe aún, muestra un placeholder elegante
========================================================= */

(() => {
  // ====== CONFIG: secciones + cantidad de fotos ======
  // NOTA: aquí defines cuántas fotos por sección (según tu lista)
  const SECTIONS = [
    { name: "Atención a caravanas", slug: "atencion-a-caravanas", count: 9 },
    { name: "Dignificando vidas", slug: "dignificando-vidas", count: 10 },
    { name: "Donaciones", slug: "donaciones", count: 12 },
    { name: "Jornada de salud", slug: "jornada-de-salud", count: 11 },
    { name: "Jornada mundial del refugiado", slug: "jornada-mundial-del-refugiado", count: 5 },
    { name: "Marcha de sensibilización", slug: "marcha-de-sensibilizacion", count: 6 },
    { name: "Navidad Ranzahuer", slug: "navidad-ranzahuer", count: 14 },
    { name: "Rumbada - Día mundial del refugiado", slug: "rumbada-dia-mundial-del-refugiado", count: 6 },
    { name: "Voluntariado", slug: "voluntariado", count: 20 },
  ];

  // Ruta base donde pondrás las fotos
  const BASE = "assets/img/galeria";

  // Helpers: 01, 02, 03...
  const pad2 = (n) => String(n).padStart(2, "0");

  // DOM
  const tabsWrap = document.getElementById("galleryTabs");
  const grid = document.getElementById("galleryGrid");
  const badge = document.getElementById("galleryCountBadge");

  if (!tabsWrap || !grid || !badge) return;

  // Estado
  let activeIndex = 0;
  let currentList = []; // urls de la sección activa
  let lbIndex = 0;
  let zoom = 1;

  // Lightbox DOM
  const lbOverlay = document.getElementById("lbOverlay");
  const lbImg = document.getElementById("lbImg");
  const lbTitle = document.getElementById("lbTitle");
  const lbClose = document.getElementById("lbClose");
  const lbPrev = document.getElementById("lbPrev");
  const lbNext = document.getElementById("lbNext");
  const lbZoomIn = document.getElementById("lbZoomIn");
  const lbZoomOut = document.getElementById("lbZoomOut");
  const lbZoomReset = document.getElementById("lbZoomReset");
  const lbZoomLabel = document.getElementById("lbZoomLabel");

  // ====== Render Tabs ======
  function renderTabs() {
    tabsWrap.innerHTML = "";

    SECTIONS.forEach((s, idx) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "gTab" + (idx === activeIndex ? " active" : "");
      btn.innerHTML = `
        <span>${s.name}</span>
        <span class="count">${s.count}</span>
      `;
      btn.addEventListener("click", () => {
        activeIndex = idx;
        renderTabs();
        renderSection();
      });
      tabsWrap.appendChild(btn);
    });
  }

  // ====== Construir lista de URLs de la sección ======
  function buildUrls(section) {
    // Ejemplo: assets/img/galeria/donaciones/01.jpg
    const urls = [];
    for (let i = 1; i <= section.count; i++) {
      urls.push(`${BASE}/${section.slug}/${pad2(i)}.jpeg`);
    }
    return urls;
  }

  // ====== Render de la sección activa ======
  function renderSection() {
    const section = SECTIONS[activeIndex];
    currentList = buildUrls(section);

    badge.innerHTML = `<i class="fa-solid fa-images"></i> ${section.count} fotos`;

    grid.innerHTML = "";

    currentList.forEach((url, i) => {
      const card = document.createElement("div");
      card.className = "gThumb";
      card.setAttribute("role", "button");
      card.setAttribute("tabindex", "0");
      card.setAttribute("aria-label", `Abrir foto ${i + 1} de ${section.name}`);

      const img = document.createElement("img");
      img.src = url;
      img.alt = `${section.name} - foto ${i + 1}`;

      // Si la imagen no existe aún, ponemos placeholder elegante
      img.onerror = () => {
        img.removeAttribute("src");
        img.alt = `${section.name} - (pendiente de cargar)`;
        // Placeholder: imagen falsa con fondo suave
        img.style.height = "190px";
        img.style.background =
          "linear-gradient(135deg, rgba(173,132,227,.18), rgba(179,204,246,.22))";
      };

      const overlay = document.createElement("div");
      overlay.className = "gOverlay";
      overlay.innerHTML = `
        <span class="gBadge">${pad2(i + 1)} / ${pad2(section.count)}</span>
        <span class="gLoupe" aria-hidden="true"><i class="fa-solid fa-magnifying-glass"></i></span>
      `;

      card.appendChild(img);
      card.appendChild(overlay);

      // Click abre lightbox
      card.addEventListener("click", () => openLightbox(i));
      // Enter también abre
      card.addEventListener("keydown", (e) => {
        if (e.key === "Enter") openLightbox(i);
      });

      grid.appendChild(card);
    });
  }

  // ====== Lightbox ======
  function setZoom(z) {
    zoom = Math.max(1, Math.min(3, z)); // 1x a 3x
    if (lbImg) lbImg.style.transform = `scale(${zoom})`;
    if (lbZoomLabel) lbZoomLabel.textContent = `${Math.round(zoom * 100)}%`;
  }

  function openLightbox(i) {
    lbIndex = i;
    setZoom(1);

    const section = SECTIONS[activeIndex];
    const url = currentList[lbIndex];

    lbImg.src = url;
    lbImg.alt = `${section.name} - foto ${lbIndex + 1}`;

    // Si no existe, igual lo mostramos con placeholder (para que no “rompa”)
    lbImg.onerror = () => {
      lbImg.removeAttribute("src");
      lbImg.style.background =
        "linear-gradient(135deg, rgba(173,132,227,.18), rgba(179,204,246,.22))";
      lbImg.style.width = "100%";
      lbImg.style.height = "54vh";
    };

    if (lbTitle) {
      lbTitle.innerHTML = `<i class="fa-solid fa-image"></i>
        <span>${section.name} · ${pad2(lbIndex + 1)} / ${pad2(section.count)}</span>`;
    }

    lbOverlay.classList.add("open");
    lbOverlay.setAttribute("aria-hidden", "false");
  }

  function closeLightbox() {
    lbOverlay.classList.remove("open");
    lbOverlay.setAttribute("aria-hidden", "true");
    lbImg.removeAttribute("style");
    lbImg.onerror = null;
  }

  function prevImg() {
    const section = SECTIONS[activeIndex];
    lbIndex = (lbIndex - 1 + section.count) % section.count;
    openLightbox(lbIndex);
  }

  function nextImg() {
    const section = SECTIONS[activeIndex];
    lbIndex = (lbIndex + 1) % section.count;
    openLightbox(lbIndex);
  }

  // Eventos lightbox
  lbClose?.addEventListener("click", closeLightbox);
  lbOverlay?.addEventListener("click", (e) => {
    // Cerrar si clic afuera del modal
    if (e.target === lbOverlay) closeLightbox();
  });

  lbPrev?.addEventListener("click", prevImg);
  lbNext?.addEventListener("click", nextImg);

  lbZoomIn?.addEventListener("click", () => setZoom(zoom + 0.25));
  lbZoomOut?.addEventListener("click", () => setZoom(zoom - 0.25));
  lbZoomReset?.addEventListener("click", () => setZoom(1));

  // Teclado
  document.addEventListener("keydown", (e) => {
    if (!lbOverlay.classList.contains("open")) return;

    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowLeft") prevImg();
    if (e.key === "ArrowRight") nextImg();

    // Zoom teclado: + - 0
    if (e.key === "+" || e.key === "=") setZoom(zoom + 0.25);
    if (e.key === "-") setZoom(zoom - 0.25);
    if (e.key === "0") setZoom(1);
  });

  // Init
  renderTabs();
  renderSection();
})();