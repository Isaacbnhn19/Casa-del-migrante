/* =========================================================
   impacto-pastel.js
   - Gráfica de pastel interactiva (2016–2025)
   - Hover + click: muestra detalle y resalta segmento
   - Botón “Ampliar”: abre modal con imagen de la gráfica
========================================================= */

(() => {
  const fmtMX = (n) => Number(n || 0).toLocaleString("es-MX");

  // ✅ Datos del DOC (2016–2025) – “literal toda” la gráfica de pastel
  const dataItems = [
    { label: "Solicitudes de refugio atendidas", value: 6515 },
    { label: "Llamadas RCF", value: 4428 },
    { label: "Acompañamientos de atención psicosocial", value: 31137 },
    { label: "Acompañamientos de trabajo social", value: 31548 },
    { label: "Asesorías legales", value: 271437 },
    { label: "Kits de aseo entregados", value: 174973 },
    { label: "Prendas entregadas", value: 679935 },
    { label: "Alimentos brindados", value: 2713435 },
  ];

  const canvas = document.getElementById("chartPie");
  const listEl = document.getElementById("pieList");

  const swatch = document.getElementById("pieSwatch");
  const titleEl = document.getElementById("pieTitle");
  const subEl = document.getElementById("pieSub");
  const valueEl = document.getElementById("pieValue");
  const hintEl = document.getElementById("pieHint");

  const btnExpand = document.getElementById("btnExpandPie");
  const modal = document.getElementById("pieModal");
  const pieImg = document.getElementById("pieImg");
  const btnClose = document.getElementById("btnClosePie");

  if (!canvas || !listEl) return;

  // Paleta suave (coherente con tu sitio claro)
  const colors = [
    "rgba(173,132,227,.92)", // lavanda
    "rgba(179,204,246,.92)", // azul suave
    "rgba(110,231,183,.85)", // menta
    "rgba(253,230,138,.90)", // amarillo suave
    "rgba(252,165,165,.88)", // coral suave
    "rgba(147,197,253,.90)", // sky
    "rgba(196,181,253,.90)", // violeta claro
    "rgba(134,239,172,.88)", // verde claro
  ];

  // Helpers UI
  function setDetail(i){
    if (i == null || i < 0 || i >= dataItems.length){
      if (swatch) swatch.style.background = "transparent";
      if (titleEl) titleEl.textContent = "Selecciona un segmento";
      if (subEl) subEl.textContent = "Pasa el cursor por la gráfica o haz clic en una categoría.";
      if (valueEl) valueEl.textContent = "—";
      if (hintEl) hintEl.textContent = "Total (2016–2025)";
      return;
    }

    const item = dataItems[i];
    if (swatch) swatch.style.background = colors[i % colors.length];
    if (titleEl) titleEl.textContent = item.label;
    if (subEl) subEl.textContent = "Clic para mantener seleccionado. (Hover para explorar)";
    if (valueEl) valueEl.textContent = fmtMX(item.value);
    if (hintEl) hintEl.textContent = "Registros (2016–2025)";
  }

  // Render list (cards)
  function renderList(onPick){
    listEl.innerHTML = "";
    dataItems.forEach((it, i) => {
      const row = document.createElement("div");
      row.className = "pieItem";
      row.setAttribute("role", "button");
      row.setAttribute("tabindex", "0");
      row.dataset.idx = String(i);

      row.innerHTML = `
        <div class="pieLeft">
          <div class="pieDot" style="background:${colors[i % colors.length]}"></div>
          <div class="pieName" title="${it.label}">${it.label}</div>
        </div>
        <div class="pieVal">${fmtMX(it.value)}</div>
      `;

      const act = () => onPick(i);

      row.addEventListener("click", act);
      row.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          act();
        }
      });

      listEl.appendChild(row);
    });
  }

  function setActiveRow(idx){
    listEl.querySelectorAll(".pieItem").forEach(el => {
      el.classList.toggle("active", el.dataset.idx === String(idx));
    });
  }

  // Chart.js
  let lockedIndex = null;

  const chart = new Chart(canvas, {
    type: "pie",
    data: {
      labels: dataItems.map(d => d.label),
      datasets: [{
        data: dataItems.map(d => d.value),
        backgroundColor: colors,
        borderColor: "rgba(255,255,255,.95)",
        borderWidth: 2,
        hoverOffset: 14,
        offset: (ctx) => {
          const i = ctx.dataIndex;
          if (lockedIndex === i) return 10;
          return 0;
        }
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const label = ctx.label || "";
              const v = ctx.raw || 0;
              return `${label}: ${fmtMX(v)}`;
            }
          }
        }
      },
      onHover: (_evt, activeEls) => {
        if (lockedIndex != null) return;
        if (!activeEls || activeEls.length === 0){
          setDetail(null);
          setActiveRow(null);
          return;
        }
        const i = activeEls[0].index;
        setDetail(i);
        setActiveRow(i);
      },
      onClick: (_evt, activeEls) => {
        if (!activeEls || activeEls.length === 0){
          lockedIndex = null;
          setDetail(null);
          setActiveRow(null);
          chart.update();
          return;
        }
        const i = activeEls[0].index;
        lockedIndex = (lockedIndex === i) ? null : i;
        if (lockedIndex == null){
          setDetail(null);
          setActiveRow(null);
        } else {
          setDetail(i);
          setActiveRow(i);
        }
        chart.update();
      }
    }
  });

  // List interactions -> chart select
  renderList((i) => {
    lockedIndex = i;
    setDetail(i);
    setActiveRow(i);

    // “Simula” selección visual
    chart.setActiveElements([{ datasetIndex: 0, index: i }]);
    chart.update();
  });

  // Init detail
  setDetail(null);

  // Modal (ampliar)
  function openModal(){
    if (!modal || !pieImg) return;
    try{
      // Exporta la gráfica a imagen (se “amplía” como pediste)
      pieImg.src = chart.toBase64Image();
      modal.hidden = false;
      document.body.style.overflow = "hidden";
    } catch {
      // fallback: no modal
    }
  }

  function closeModal(){
    if (!modal) return;
    modal.hidden = true;
    document.body.style.overflow = "";
  }

  btnExpand?.addEventListener("click", openModal);
  btnClose?.addEventListener("click", closeModal);

  modal?.addEventListener("click", (e) => {
    const t = e.target;
    if (t && t.matches && t.matches("[data-close='1']")) closeModal();
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal && !modal.hidden) closeModal();
  });

})();