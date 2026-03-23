/* =========================================================
   Contacto (interactividad ligera, tipo FM4)
   - Copiar correo (general y por persona)
   - Formulario REAL con EmailJS (manda correo de verdad)
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

  // ===== Formulario REAL (EmailJS) =====
  const form = document.getElementById("contactForm");
  const status = document.getElementById("formStatus");
  const sendBtn = document.getElementById("sendBtn");

  function setStatus(msg) {
    if (status) status.textContent = msg;
  }

  function setLoading(isLoading) {
    if (!sendBtn) return;
    sendBtn.disabled = isLoading;
    sendBtn.style.opacity = isLoading ? "0.75" : "1";
    sendBtn.style.cursor = isLoading ? "not-allowed" : "pointer";
  }

  form?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = form.querySelector('[name="name"]')?.value?.trim();
    const email = form.querySelector('[name="email"]')?.value?.trim();
    const msg = form.querySelector('[name="msg"]')?.value?.trim();

    if (!name || !email || !msg) {
      setStatus("Completa todos los campos ❗");
      return;
    }

    if (!window.emailjs || !window.EMAILJS_SERVICE_ID || !window.EMAILJS_TEMPLATE_ID) {
      setStatus("EmailJS no está configurado (IDs). ❌");
      return;
    }

    setLoading(true);
    setStatus("Enviando... ⏳");

    const params = {
      to_email: window.CONTACT_TO_EMAIL || "casadelmigranter@gmail.com",
      from_name: name,
      from_email: email,
      message: msg,
    };

    try {
      await emailjs.send(
        window.EMAILJS_SERVICE_ID,
        window.EMAILJS_TEMPLATE_ID,
        params
      );

      setStatus("Mensaje enviado ✅ Muchas gracias");
      form.reset();
      setTimeout(() => setStatus(""), 3500);

    } catch (err) {
      console.error("EmailJS error:", err);
      setStatus("No se pudo enviar ❌ Revisa el template/servicio.");
    } finally {
      setLoading(false);
    }
  });
})();