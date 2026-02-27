/* assets/js/impacto.js
   Impacto: gráficas + tablas + controles.
   Fuente: Excel “Estadistcas Ranzahuer.xlsx” (2025)
*/

(() => {
  // ===== Dataset 2025 (extraído del Excel) =====
  const DATA = {
    year: 2025,
    totalAtenciones: 2465,
    countries: [
      { name: "EL SALVADOR", total: 114 },
      { name: "GUATEMALA", total: 214 },
      { name: "HONDURAS", total: 706 },
      { name: "NICARAGUA", total: 53 },
      { name: "HAITI", total: 19 },
      { name: "VENEZUELA", total: 908 },
      { name: "CUBA", total: 22 },
      { name: "OTROS", total: 429 }
    ],
    profiles: [
      { name: "NIÑAS", total: 296 },
      { name: "NIÑOS", total: 341 },
      { name: "ADOLESCENTES", total: 206 },
      { name: "MUJERES", total: 691 },
      { name: "HOMBRES", total: 931 }
    ],
    community: [
      { name: "EMBARAZADAS", total: 37 },
      { name: "DISCAPACIDAD", total: 14 },
      { name: "LGBTT+", total: 21 }
    ],
    communityTotal: 72
  };

  const formatMX = (n) => Number(n).toLocaleString("es-MX");

  // ===== Contadores animados (si existen .countUp) =====
  function animateCount(el, target, duration = 1100) {
    const start = 0;
    const startTime = performance.now();

    function tick(now) {
      const t = Math.min(1, (now - startTime) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const value = Math.round(start + (target - start) * eased);
      el.textContent = formatMX(value);
      if (t < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  function runCountersOnce() {
    const els = document.querySelectorAll(".countUp, .countUpInline");
    els.forEach((el) => {
      if (el.dataset.done === "1") return;
      const target = Number(el.dataset.count || "0");
      el.dataset.done = "1";
      animateCount(el, target, 1100);
    });
  }

  // ===== Helpers: tabla =====
  function fillTable(tbodyId, rows) {
    const tb = document.getElementById(tbodyId);
    if (!tb) return;
    tb.innerHTML = rows
      .map(r => `<tr><td>${r.name}</td><td>${formatMX(r.total)}</td></tr>`)
      .join("");
  }

  // ===== Charts =====
  let chartCountries, chartProfiles, chartCommunity;

  function buildChart(ctx, labels, values, title) {
    return new Chart(ctx, {
      type: "bar",
      data: {
        labels,
        datasets: [{
          label: title,
          data: values,
          borderWidth: 0,
          borderRadius: 10
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 900 },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (item) => ` ${formatMX(item.raw)}`
            }
          }
        },
        scales: {
          x: {
            ticks: {
              color: "rgba(20,36,70,.85)",
              font: { weight: "700" }
            },
            grid: { display: false }
          },
          y: {
            ticks: {
              color: "rgba(20,36,70,.70)",
              callback: (v) => formatMX(v)
            },
            grid: { color: "rgba(20,36,70,.10)" }
          }
        }
      }
    });
  }

  function getCountriesFiltered() {
    const includeOtros = document.getElementById("toggleOtros")?.checked ?? true;
    let arr = [...DATA.countries];

    if (!includeOtros) {
      arr = arr.filter(x => x.name !== "OTROS");
    }

    const sortMode = document.getElementById("sortCountries")?.value || "desc";
    if (sortMode === "desc") arr.sort((a,b) => b.total - a.total);
    if (sortMode === "asc") arr.sort((a,b) => a.total - b.total);
    if (sortMode === "az") arr.sort((a,b) => a.name.localeCompare(b.name));

    return arr;
  }

  function renderCountries() {
    const arr = getCountriesFiltered();

    // Tabla
    fillTable("countriesTbody", arr);

    // Chart
    const labels = arr.map(x => x.name);
    const values = arr.map(x => x.total);

    if (chartCountries) {
      chartCountries.data.labels = labels;
      chartCountries.data.datasets[0].data = values;
      chartCountries.update();
      return;
    }

    const canvas = document.getElementById("chartCountries");
    if (!canvas) return;
    chartCountries = buildChart(canvas, labels, values, "Países");
  }

  function renderProfiles() {
    fillTable("profilesTbody", DATA.profiles);

    const labels = DATA.profiles.map(x => x.name);
    const values = DATA.profiles.map(x => x.total);

    const canvas = document.getElementById("chartProfiles");
    if (!canvas) return;

    chartProfiles = buildChart(canvas, labels, values, "Perfiles");
  }

  function renderCommunity() {
    fillTable("communityTbody", DATA.community);

    const labels = DATA.community.map(x => x.name);
    const values = DATA.community.map(x => x.total);

    const canvas = document.getElementById("chartCommunity");
    if (!canvas) return;

    chartCommunity = new Chart(canvas, {
      type: "bar",
      data: {
        labels,
        datasets: [{
          label: "Comunidad",
          data: values,
          borderRadius: 10
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: {
            ticks: { color: "rgba(20,36,70,.85)", font: { weight: "700" } },
            grid: { display: false }
          },
          y: {
            ticks: { color: "rgba(20,36,70,.70)", callback: (v) => formatMX(v) },
            grid: { color: "rgba(20,36,70,.10)" }
          }
        }
      }
    });
  }

  // ===== Inicialización =====
  function init() {
    // Animar contadores cuando entre la sección en pantalla (pro)
    const watchTarget = document.querySelector(".impactStats")?.closest(".sectionCard");
    if (watchTarget) {
      const io = new IntersectionObserver((entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            runCountersOnce();
            io.disconnect();
            break;
          }
        }
      }, { threshold: 0.25 });

      io.observe(watchTarget);
    } else {
      runCountersOnce();
    }

    // Render inicial
    renderCountries();
    renderProfiles();
    renderCommunity();

    // Listeners
    document.getElementById("toggleOtros")?.addEventListener("change", renderCountries);
    document.getElementById("sortCountries")?.addEventListener("change", renderCountries);
  }

  document.addEventListener("DOMContentLoaded", init);
})();