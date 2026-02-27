/* 30-footer-year.js
   Año dinámico en footer: <span id="year"></span>
*/

document.addEventListener("DOMContentLoaded", () => {
  const y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();
});