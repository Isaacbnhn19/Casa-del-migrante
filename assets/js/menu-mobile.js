document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.getElementById("menuToggle");
  const nav = document.getElementById("navMain");
  const itemsWithDrop = document.querySelectorAll(".hasDrop");

  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      nav.classList.toggle("isOpen");
      const expanded = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!expanded));

      if (!nav.classList.contains("isOpen")) {
        itemsWithDrop.forEach((item) => item.classList.remove("open"));
      }
    });
  }

  itemsWithDrop.forEach((item) => {
    const link = item.querySelector(".navLink");
    const hasDrop = item.querySelector(".navDrop");
    if (!link || !hasDrop) return;

    link.addEventListener("click", (e) => {
      if (window.innerWidth <= 900) {
        e.preventDefault();

        const isOpen = item.classList.contains("open");

        itemsWithDrop.forEach((otherItem) => {
          otherItem.classList.remove("open");
        });

        if (!isOpen) {
          item.classList.add("open");
        }
      }
    });
  });
});