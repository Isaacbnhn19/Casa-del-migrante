/* =========================================================
   DONAR (demo tipo FM4) + Registro real en PostgreSQL
   - Montos: botones + monto custom
   - Resumen sticky que se actualiza
   - Continuar: muestra campos de tarjeta si método=tarjeta
   - Confirmar: registra en /api/donations (PostgreSQL)
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

  // Card preview
  const cardNumber = document.getElementById("cardNumber");
  const cardName = document.getElementById("cardName");
  const cardExp = document.getElementById("cardExp");
  const cardDigitsPreview = document.getElementById("cardDigitsPreview");
  const cardNamePreview = document.getElementById("cardNamePreview");
  const cardExpPreview = document.getElementById("cardExpPreview");
  const cardCvc = document.getElementById("cardCvc");

  // 👇 Para evitar doble submit
  let isSubmitting = false;

  const fmtMXN = (n) => `$${Number(n || 0).toLocaleString("es-MX")} MXN`;

  function setStatus(msg) {
    if (status) status.textContent = msg || "";
  }

  function getMethodLabel(){
    const v = methodInputs.find(i => i.checked)?.value || "card";
    return v === "card" ? "Tarjeta" : "Transferencia";
  }

  function getMethodCode(){
    const v = methodInputs.find(i => i.checked)?.value || "card";
    return v === "card" ? "card" : "transfer";
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
      else sumHint.textContent = "Continúa para capturar los datos de tarjeta (demo).";
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

  // Continue to payment
  btnContinue?.addEventListener("click", () => {
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

    payStep?.removeAttribute("hidden");
    payStep?.scrollIntoView({ behavior: "smooth", block: "start" });
    setStatus("Completa los datos de tarjeta (demo).");
  });

  btnBack?.addEventListener("click", () => {
    payStep?.setAttribute("hidden", "true");
    btnContinue?.scrollIntoView({ behavior: "smooth", block: "start" });
    setStatus("");
  });

  // Card formatting helpers (demo)
  function formatCardDigits(value){
    const digits = value.replace(/\D/g, "").slice(0, 16);
    const groups = digits.match(/.{1,4}/g) || [];
    return groups.join(" ").trim();
  }

  function formatExp(value){
    const digits = value.replace(/\D/g, "").slice(0, 4);
    if (digits.length <= 2) return digits;
    return `${digits.slice(0,2)}/${digits.slice(2)}`;
  }

  cardNumber?.addEventListener("input", () => {
    cardNumber.value = formatCardDigits(cardNumber.value);
    const v = cardNumber.value.replace(/\s/g, "");
    const tail = v.slice(-4);
    cardDigitsPreview.textContent = v.length ? `•••• •••• •••• ${tail.padStart(4,"•")}` : "•••• •••• •••• ••••";
  });

  cardName?.addEventListener("input", () => {
    const v = (cardName.value || "").trim();
    cardNamePreview.textContent = v ? v.toUpperCase().slice(0, 18) : "TITULAR";
  });

  cardExp?.addEventListener("input", () => {
    cardExp.value = formatExp(cardExp.value);
    const v = (cardExp.value || "").trim();
    cardExpPreview.textContent = v || "MM/AA";
  });

  cardCvc?.addEventListener("input", () => {
    cardCvc.value = cardCvc.value.replace(/\D/g, "").slice(0, 4);
  });

  // Helpers para leer datos del donante SIN depender de IDs exactos
  function pickField(selectors){
    for (const sel of selectors){
      const el = form?.querySelector(sel) || document.querySelector(sel);
      if (el) return el;
    }
    return null;
  }

  function getDonorData(){
    // Busca por name="", y si no, por IDs comunes
    const nameEl = pickField(['[name="name"]', '#name', '#donName', '#donorName', '#fullName']);
    const phoneEl = pickField(['[name="phone"]', '#phone', '#donPhone', '#donorPhone', '#tel']);
    const emailEl = pickField(['[name="email"]', '#email', '#donEmail', '#donorEmail']);
    const msgEl = pickField(['[name="message"]', '#message', '#donMessage', '#donorMessage', 'textarea']);

    return {
      name: String(nameEl?.value || "").trim(),
      phone: String(phoneEl?.value || "").trim(),
      email: String(emailEl?.value || "").trim(),
      message: String(msgEl?.value || "").trim(),
    };
  }

  function resetUIAfterSuccess(){
    form.reset();
    payStep?.setAttribute("hidden", "true");
    amtBtns.forEach(b => b.classList.remove("active"));
    if (cardDigitsPreview) cardDigitsPreview.textContent = "•••• •••• •••• ••••";
    if (cardNamePreview) cardNamePreview.textContent = "TITULAR";
    if (cardExpPreview) cardExpPreview.textContent = "MM/AA";
    updateSummary();
  }

  // ✅ Submit: REGISTRA EN POSTGRESQL
  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    const amt = getAmount();
    if (amt <= 0){
      setStatus("Por favor elige un monto.");
      return;
    }

    const methodCode = getMethodCode(); // "card" | "transfer"
    const donor = getDonorData();

    // Validación mínima (tu backend exige name, email, amount)
    if (!donor.name || !donor.email){
      setStatus("Por favor completa tu nombre y correo para registrar la donación.");
      return;
    }

    // Si es tarjeta, validación demo mínima (no guardamos tarjeta, solo validamos)
    if (methodCode === "card"){
      const digits = (cardNumber?.value || "").replace(/\s/g, "");
      const exp = (cardExp?.value || "").trim();
      const cvc = (cardCvc?.value || "").trim();

      if (digits.length < 13 || digits.length > 16){
        setStatus("Revisa el número de tarjeta (demo).");
        return;
      }
      if (exp.length < 4){
        setStatus("Revisa la fecha MM/AA (demo).");
        return;
      }
      if (cvc.length < 3){
        setStatus("Revisa el CVC (demo).");
        return;
      }
    }

    try{
      isSubmitting = true;
      setStatus("Procesando donación…");

      const res = await fetch("/api/donations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: donor.name,
          phone: donor.phone,
          email: donor.email,
          message: donor.message,
          amount: amt,
          payment_method: methodCode, // ✅ queda en la BD (si tienes la columna)
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data?.ok){
        const msg = data?.error || "No se pudo registrar la donación.";
        setStatus(`❌ ${msg}`);
        isSubmitting = false;
        return;
      }

      // Éxito
      setStatus("✅ Donación registrada. ¡Gracias por tu apoyo!");
      resetUIAfterSuccess();

      setTimeout(() => setStatus(""), 3000);
    } catch (err){
      setStatus("❌ Error de red. Verifica que el servidor esté corriendo.");
    } finally{
      isSubmitting = false;
    }
  });

  // Copy bank helpers
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