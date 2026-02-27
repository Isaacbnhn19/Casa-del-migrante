/* 40-menu-disable.js
   Desactiva clic en menús padre (solo hover).
   - Conócenos
   - Ayúdanos a ayudar
   - Actualidad
*/

document.addEventListener("DOMContentLoaded", () => {
  const disableLinks = new Set([
    "Conócenos",
    "Ayúdanos a ayudar",
    "Actualidad",
  ]);

  document.querySelectorAll("nav a").forEach((link) => {
    const txt = link.textContent.trim();
    if (disableLinks.has(txt)) {
      link.addEventListener("click", (e) => e.preventDefault());
    }
  });
});