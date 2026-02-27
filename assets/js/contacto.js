/* =========================================================
   Contacto (interactividad ligera, tipo FM4)
   - Copiar correo (general y por persona)
   - Formulario demo: muestra “enviado” sin backend
========================================================= */

(() => {
  const hint = document.getElementById("copyHint");

  function flash(msg) {
    if (!hint) return;
    hint.textContent = msg;
    setTimeout(() => (hint.textContent = ""), 2200);
  }

  async function copyText(txt) {
    try {
      await navigator.clipboard.writeText(txt);
      flash(`Copiado: ${txt}`);
    } catch {
      flash("No se pudo copiar (permiso del navegador).");
    }
  }

  // Botón correo general (ejemplo)
  const copyMain = document.getElementById("copyMainMail");
  copyMain?.addEventListener("click", () => copyText("misericorde.mig777@gmail.com"));

  // Copiar correos del organigrama
  document.querySelectorAll("[data-copy]").forEach((btn) => {
    btn.addEventListener("click", () => copyText(btn.getAttribute("data-copy") || ""));
  });

  // Formulario demo
  const form = document.getElementById("contactForm");
  const status = document.getElementById("formStatus");

  form?.addEventListener("submit", (e) => {
    e.preventDefault();
    if (status) status.textContent = "Mensaje enviado (demo). ✅";
    form.reset();
    setTimeout(() => {
      if (status) status.textContent = "";
    }, 2600);
  });
})();