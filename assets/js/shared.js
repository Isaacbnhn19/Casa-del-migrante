// shared.js - utilidades comunes
(() => {
  const y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();
})();