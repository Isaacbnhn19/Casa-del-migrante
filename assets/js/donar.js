/* =========================================================
   DONAR + Registro en PostgreSQL (intención)
   - Montos: botones + monto custom
   - Resumen sticky que se actualiza
   - Continuar:
       - Transferencia -> baja a datos bancarios
       - PayPal -> muestra botón PayPal (abre link)
   - Registro: POST /api/donations (antes de mandar a PayPal)
   - Copiar cuenta/CLABE
========================================================= */

(() => {
  const form = document.getElementById("donateForm");
  const status = document.getElementById("donStatus");

  // Amount
  const amtCustom = document.getElementById("amtCustom");
  const amtBtns = Array.from(document.querySelectorAll(".amountBtn"));

  // Steps
  const btnContinue = document.getElementById("btnContinue");
  const btnBack = document.getElementById("btnBack");
  const payStep = document.getElementById("payStep");

  // Method
  const methodInputs = Array.from(document.querySelectorAll('input[name="payMethod"]'));

  // Summary
  const sumAmount = document.getElementById("sumAmount");
  const sumTotal = document.getElementById("sumTotal");
  const sumMethod = document.getElementById("sumMethod");
  const sumHint = document.getElementById("sumHint");

  // PayPal button link
  const paypalDonateBtn = document.getElementById("paypalDonateBtn");

  // 👇 Para evitar doble submit
  let isSubmitting = false;

  const fmtMXN = (n) => `$${Number(n || 0).toLocaleString("es-MX")} MXN`;

  function setStatus(msg) {
    if (status) status.textContent = msg || "";
  }

  function getMethodLabel(){
    const v = methodInputs.find(i => i.checked)?.value || "paypal";
    if (v === "transfer") return "Transferencia";
    if (v === "paypal") return "PayPal";
    return "PayPal";
  }

  function getMethodCode(){
    const v = methodInputs.find(i => i.checked)?.value || "paypal";
    if (v === "transfer") return "transfer";
    if (v === "paypal") return "paypal";
    return "paypal";
  }

  function getAmount(){
    const v = Number((amtCustom?.value || "").toString().trim());
    return Number.isFinite(v) && v > 0 ? v : 0;
  }

  function updateSummary(){
    const amt = getAmount();
    const method = getMethodLabel();

    if (sumAmount) sumAmount.textContent = fmtMXN(amt);
    if (sumTotal) sumTotal.textContent = fmtMXN(amt);
    if (sumMethod) sumMethod.textContent = method;

    if (sumHint){
      if (amt <= 0) sumHint.textContent = "Completa el monto para continuar.";
      else if (method === "Transferencia") sumHint.textContent = "Puedes usar los datos bancarios al final.";
      else sumHint.textContent = "Continúa para donar con PayPal.";
    }
  }

  // Amount buttons
  amtBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      amtBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const amt = btn.getAttribute("data-amt") || "";
      if (amtCustom) amtCustom.value = amt;
      updateSummary();
    });
  });

  // Custom amount typing
  amtCustom?.addEventListener("input", () => {
    amtBtns.forEach(b => b.classList.remove("active"));
    updateSummary();
  });

  // Method change
  methodInputs.forEach((i) => i.addEventListener("change", updateSummary));

  // Helpers para leer datos del donante
  function pickField(selectors){
    for (const sel of selectors){
      const el = form?.querySelector(sel) || document.querySelector(sel);
      if (el) return el;
    }
    return null;
  }

  function getDonorData(){
    const nameEl = pickField(['[name="name"]', '#donName']);
    const phoneEl = pickField(['[name="phone"]', '#donPhone']);
    const emailEl = pickField(['[name="email"]', '#donEmail']);
    const msgEl = pickField(['[name="message"]', '#donMsg', 'textarea']);

    return {
      name: String(nameEl?.value || "").trim(),
      phone: String(phoneEl?.value || "").trim(),
      email: String(emailEl?.value || "").trim(),
      message: String(msgEl?.value || "").trim(),
    };
  }

  async function registerDonationIntent(){
    const amt = getAmount();
    const methodCode = getMethodCode();
    const donor = getDonorData();

    if (amt <= 0) throw new Error("Por favor elige un monto.");
    if (!donor.name || !donor.email) throw new Error("Completa tu nombre y correo.");

    const res = await fetch("/api/donations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: donor.name,
        phone: donor.phone,
        email: donor.email,
        message: donor.message,
        amount: amt,
        payment_method: methodCode, // paypal | transfer
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data?.ok){
      throw new Error(data?.error || "No se pudo registrar la donación.");
    }
    return data;
  }

  // Continue to payment
  btnContinue?.addEventListener("click", async () => {
    const amt = getAmount();
    const method = getMethodLabel();

    if (amt <= 0){
      setStatus("Por favor elige un monto para continuar.");
      return;
    }

    setStatus("");

    if (method === "Transferencia"){
      payStep?.setAttribute("hidden", "true");
      document.querySelector(".bankCard")?.scrollIntoView({ behavior: "smooth", block: "start" });
      setStatus("Perfecto. Usa los datos bancarios al final. ✅");
      return;
    }

    // PayPal
    payStep?.removeAttribute("hidden");
    payStep?.scrollIntoView({ behavior: "smooth", block: "start" });
    setStatus("Listo. Da clic en “Donar con PayPal”.");
  });

  btnBack?.addEventListener("click", () => {
    payStep?.setAttribute("hidden", "true");
    btnContinue?.scrollIntoView({ behavior: "smooth", block: "start" });
    setStatus("");
  });

  // ✅ Al dar clic en “Donar con PayPal”: registrar en BD y abrir PayPal
  paypalDonateBtn?.addEventListener("click", async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    try{
      isSubmitting = true;
      setStatus("Registrando donación…");

      await registerDonationIntent();

      setStatus("✅ Registro guardado. Abriendo PayPal…");
      // abre el enlace en nueva pestaña
      window.open(paypalDonateBtn.href, "_blank", "noopener");

      setTimeout(() => setStatus(""), 2500);
    } catch (err){
      setStatus(`❌ ${err?.message || "No se pudo registrar."}`);
    } finally{
      isSubmitting = false;
    }
  });

  // Copiar cuenta/CLABE
  const hint = document.getElementById("bankHint");

  function flash(msg){
    if (!hint) return;
    hint.textContent = msg;
    setTimeout(() => (hint.textContent = ""), 2200);
  }

  async function copyText(txt){
    try{
      await navigator.clipboard.writeText(txt);
      flash(`Copiado: ${txt}`);
    }catch{
      flash("No se pudo copiar (permiso del navegador).");
    }
  }

  document.querySelectorAll("[data-copy]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const sel = btn.getAttribute("data-copy");
      if (!sel) return;
      const el = document.querySelector(sel);
      const txt = el?.textContent?.trim() || "";
      if (txt) copyText(txt);
    });
  });

  // Init
  updateSummary();
})();