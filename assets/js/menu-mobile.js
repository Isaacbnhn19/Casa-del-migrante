document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.getElementById("menuToggle");
  const nav = document.getElementById("navMain");
  const itemsWithDrop = document.querySelectorAll(".hasDrop");

  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      nav.classList.toggle("isOpen");
      const expanded = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!expanded));
    });
  }

  if (window.innerWidth <= 900) {
    itemsWithDrop.forEach((item) => {
      const link = item.querySelector(".navLink");
      if (!link) return;

      link.addEventListener("click", (e) => {
        const hasDrop = item.querySelector(".navDrop");
        if (hasDrop) {
          e.preventDefault();
          item.classList.toggle("open");
        }
      });
    });
  }
});