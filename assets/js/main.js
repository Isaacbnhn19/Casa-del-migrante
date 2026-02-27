// Dropdown menú (desktop)
const dropdownWrap = document.getElementById("dropdownWrap");
const menuBtn = document.getElementById("menuBtn");
const dropdown = document.getElementById("dropdown");

function closeDropdown() {
  dropdown.classList.add("invisible", "opacity-0", "translate-y-2", "pointer-events-none");
}
function openDropdown() {
  dropdown.classList.remove("invisible", "opacity-0", "translate-y-2", "pointer-events-none");
}

if (menuBtn && dropdown) {
  menuBtn.addEventListener("click", (e) => {
    e.preventDefault();
    const isClosed = dropdown.classList.contains("invisible");
    isClosed ? openDropdown() : closeDropdown();
  });

  document.addEventListener("click", (e) => {
    if (!dropdownWrap.contains(e.target)) closeDropdown();
  });
}

// Mobile panel
const mobileBtn = document.getElementById("mobileBtn");
const mobilePanel = document.getElementById("mobilePanel");
if (mobileBtn && mobilePanel) {
  mobileBtn.addEventListener("click", () => {
    mobilePanel.classList.toggle("hidden");
  });
}

// Año
document.getElementById("year").textContent = new Date().getFullYear();

// Animación de contadores
function animateCount(el, target, duration = 1100) {
  const start = 0;
  const startTime = performance.now();

  function tick(now) {
    const p = Math.min((now - startTime) / duration, 1);
    const val = Math.floor(start + (target - start) * (1 - Math.pow(1 - p, 3)));
    el.textContent = val.toLocaleString("es-MX");
    if (p < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

const counters = document.querySelectorAll("[data-count]");
const obs = new IntersectionObserver((entries, o) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      const el = entry.target;
      const target = Number(el.getAttribute("data-count") || "0");
      animateCount(el, target);
      o.unobserve(el);
    }
  });
}, { threshold: 0.25 });

counters.forEach((c) => obs.observe(c));

// Donación rápida (chips)
const amountInput = document.querySelector('input[name="amount"]');
document.querySelectorAll("[data-quick]").forEach(btn => {
  btn.addEventListener("click", () => {
    if (amountInput) amountInput.value = btn.getAttribute("data-quick");
  });
});

// Formulario Donaciones:
// - Modo demo: simula éxito
// - Modo con BD: manda a http://localhost:3000/api/donations (si levantas server)
const donationForm = document.getElementById("donationForm");
const donationStatus = document.getElementById("donationStatus");

const USE_API = true; // <-- Cámbialo a true si usas el server/ de abajo
const API_URL = "http://localhost:3000/api/donations";

if (donationForm) {
  donationForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    donationStatus.textContent = "Procesando...";

    const formData = new FormData(donationForm);
    const payload = Object.fromEntries(formData.entries());
    payload.amount = Number(payload.amount);

    try {
      if (USE_API) {
        const res = await fetch(API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) throw new Error("No se pudo registrar.");
        const data = await res.json();
        donationStatus.textContent = `✅ Donación registrada (ID: ${data.id}). ¡Gracias!`;
      } else {
        // Demo (sin BD)
        await new Promise(r => setTimeout(r, 600));
        donationStatus.textContent = "✅ Donación registrada (modo demo). ¡Gracias por tu apoyo!";
      }

      donationForm.reset();
    } catch (err) {
      donationStatus.textContent = "❌ Ocurrió un error. Intenta de nuevo.";
    }
  });
}

// ====== Donaciones: Totales + Reloj en tiempo real ======
const statTotalDonations = document.getElementById("statTotalDonations");
const statTotalAmount = document.getElementById("statTotalAmount");
const statClock = document.getElementById("statClock");
const statServerSync = document.getElementById("statServerSync");

function formatMoneyMXN(value) {
  return "$" + Number(value || 0).toLocaleString("es-MX");
}

function updateClock() {
  if (!statClock) return;
  const now = new Date();
  // Formato tipo: 06/01/2026 10:35:20 p. m.
  const date = now.toLocaleDateString("es-MX");
  const time = now.toLocaleTimeString("es-MX");
  statClock.textContent = `${date} ${time}`;
}

async function loadDonationStats() {
  if (!statTotalDonations || !statTotalAmount) return;

  try {
    const res = await fetch("/api/donations/stats");
    if (!res.ok) throw new Error("No stats");
    const data = await res.json();

    statTotalDonations.textContent = Number(data.total_donations || 0).toLocaleString("es-MX");
    statTotalAmount.textContent = formatMoneyMXN(data.total_amount || 0);

    if (statServerSync) {
      const serverTime = data.server_time ? new Date(data.server_time) : null;
      statServerSync.textContent = serverTime
        ? `Sincronizado: ${serverTime.toLocaleString("es-MX")}`
        : "Sincronizado.";
    }
  } catch (e) {
    statTotalDonations.textContent = "—";
    statTotalAmount.textContent = "—";
    if (statServerSync) statServerSync.textContent = "No se pudo cargar totales.";
  }
}

// Reloj
updateClock();
setInterval(updateClock, 1000);

// Totales al cargar
loadDonationStats();

// Cuando se registra una donación, recarga totales automáticamente
// (esto se engancha al submit existente si está el elemento donationForm)
if (typeof donationForm !== "undefined" && donationForm) {
  donationForm.addEventListener("submit", () => {
    // Espera un poco para que el server guarde y luego consulta stats
    setTimeout(loadDonationStats, 700);
  });
}