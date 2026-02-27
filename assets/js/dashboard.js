/* =========================================================
   dashboard.js
   - Auth check (/api/me)
   - Fetch donations + stats (PostgreSQL)
   - Filter by month / date range
   - Export PDF (jsPDF + autoTable) with logo + footer note
   - Export Excel (.xls HTML) with logo + footer note
========================================================= */

(() => {
  const rowsEl = document.getElementById("rows");
  const statusEl = document.getElementById("status");

  const statTotalDonations = document.getElementById("statTotalDonations");
  const statTotalAmount = document.getElementById("statTotalAmount");
  const statDate = document.getElementById("statDate");
  const statTime = document.getElementById("statTime");

  const refreshBtn = document.getElementById("refreshBtn");
  const logoutBtn = document.getElementById("logoutBtn");

  const exportPdfBtn = document.getElementById("exportPdfBtn");
  const exportXlsBtn = document.getElementById("exportXlsBtn");

  const monthFilter = document.getElementById("monthFilter");
  const dateFrom = document.getElementById("dateFrom");
  const dateTo = document.getElementById("dateTo");
  const applyFilterBtn = document.getElementById("applyFilterBtn");
  const clearFilterBtn = document.getElementById("clearFilterBtn");

  let allDonations = [];
  let filteredDonations = [];

  function esc(s){
    return String(s ?? "").replace(/[&<>"']/g, m =>
      ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])
    );
  }

  function formatMoneyMXN(value){
    return "$" + Number(value || 0).toLocaleString("es-MX");
  }

  function setStatus(msg){
    if (statusEl) statusEl.textContent = msg || "";
  }

  function parseDateSafe(val){
    // Backend puede mandar string tipo ISO o timestamp; esto intenta convertirlo a Date
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  }

  function toDateInputValue(d){
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }

  function updateClock(){
    const now = new Date();
    if (statDate) statDate.textContent = now.toLocaleDateString("es-MX");
    if (statTime) statTime.textContent = now.toLocaleTimeString("es-MX");
  }
  updateClock();
  setInterval(updateClock, 1000);

  async function requireAuth(){
    const res = await fetch("/api/me");
    if (!res.ok) {
      window.location.href = "/login.html";
      return false;
    }
    return true;
  }

  async function loadStats(){
    try{
      const res = await fetch("/api/donations/stats");
      if(!res.ok) throw new Error("No stats");
      const data = await res.json();

      if (statTotalDonations) statTotalDonations.textContent = Number(data.total_donations || 0).toLocaleString("es-MX");
      if (statTotalAmount) statTotalAmount.textContent = formatMoneyMXN(data.total_amount || 0);
    }catch{
      if (statTotalDonations) statTotalDonations.textContent = "—";
      if (statTotalAmount) statTotalAmount.textContent = "—";
    }
  }

  function renderTable(list){
    if (!rowsEl) return;
    rowsEl.innerHTML = "";

    if (!Array.isArray(list) || list.length === 0){
      setStatus("No hay donaciones para el filtro seleccionado.");
      return;
    }

    for (const d of list){
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${esc(d.id)}</td>
        <td>${esc(d.name)}</td>
        <td>${esc(d.phone)}</td>
        <td>${esc(d.email)}</td>
        <td>${formatMoneyMXN(d.amount)}</td>
        <td>${esc(d.payment_method || "")}</td>
        <td>${esc(d.message)}</td>
        <td>${esc(d.created_at)}</td>
      `;
      rowsEl.appendChild(tr);
    }

    setStatus(`✅ Mostrando ${list.length} donaciones.`);
  }

  function applyFilter(){
    const monthVal = monthFilter?.value ?? "all";
    const fromVal = dateFrom?.value || "";
    const toVal = dateTo?.value || "";

    const fromD = fromVal ? new Date(fromVal + "T00:00:00") : null;
    const toD = toVal ? new Date(toVal + "T23:59:59") : null;

    filteredDonations = allDonations.filter((d) => {
      const dd = parseDateSafe(d.created_at) || parseDateSafe(d.createdAt) || null;
      if (!dd) return true;

      // mes
      if (monthVal !== "all"){
        const m = Number(monthVal);
        if (dd.getMonth() !== m) return false;
      }

      // rango
      if (fromD && dd < fromD) return false;
      if (toD && dd > toD) return false;

      return true;
    });

    renderTable(filteredDonations);
  }

  function clearFilter(){
    if (monthFilter) monthFilter.value = "all";
    if (dateFrom) dateFrom.value = "";
    if (dateTo) dateTo.value = "";
    filteredDonations = [...allDonations];
    renderTable(filteredDonations);
  }

  async function loadDonations(){
    setStatus("Cargando donaciones...");
    try{
      const res = await fetch("/api/donations");
      if(!res.ok){
        if(res.status === 401){
          window.location.href = "/login.html";
          return;
        }
        throw new Error("No se pudo cargar");
      }

      const data = await res.json();
      allDonations = Array.isArray(data) ? data : [];
      filteredDonations = [...allDonations];

      renderTable(filteredDonations);
    }catch{
      setStatus("❌ Error cargando donaciones.");
    }
  }

  async function fetchLogoDataURL(){
    // Convierte assets/img/logo.png en base64 para incrustar en PDF/Excel
    try{
      const res = await fetch("assets/img/logo.png");
      const blob = await res.blob();
      return await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });
    }catch{
      return null;
    }
  }

  async function exportPDF(){
    const list = filteredDonations?.length ? filteredDonations : allDonations;
    if (!list || list.length === 0){
      setStatus("No hay datos para exportar.");
      return;
    }

    const logoData = await fetchLogoDataURL();

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF("p", "pt", "a4");

    const marginX = 40;
    let y = 40;

    // Header con logo
    if (logoData){
      doc.addImage(logoData, "PNG", marginX, y, 46, 46);
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("Casa del Migrante", marginX + 60, y + 18);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("Mons. Guillermo Ranzahuer González", marginX + 60, y + 34);

    y += 70;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Reporte de donaciones", marginX, y);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Generado: ${new Date().toLocaleString("es-MX")}`, marginX, y + 16);

    const body = list.map(d => ([
      String(d.id ?? ""),
      String(d.name ?? ""),
      String(d.phone ?? ""),
      String(d.email ?? ""),
      formatMoneyMXN(d.amount),
      String(d.payment_method ?? ""),
      String(d.message ?? ""),
      String(d.created_at ?? ""),
    ]));

    doc.autoTable({
      startY: y + 30,
      head: [["ID", "Nombre", "Teléfono", "Correo", "Monto", "Método", "Mensaje", "Fecha"]],
      body,
      styles: { font: "helvetica", fontSize: 8, cellPadding: 6 },
      headStyles: { fillColor: [240, 243, 250], textColor: [20, 36, 70] },
      alternateRowStyles: { fillColor: [250, 251, 255] },
      margin: { left: marginX, right: marginX },
    });

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++){
      doc.setPage(i);
      doc.setFontSize(9);
      doc.setTextColor(90);
      doc.text(
        "Datos internos — Casa del Migrante Mons. Guillermo Ranzahuer González.",
        marginX,
        doc.internal.pageSize.getHeight() - 30
      );
      doc.text(
        `Página ${i} de ${pageCount}`,
        doc.internal.pageSize.getWidth() - marginX,
        doc.internal.pageSize.getHeight() - 30,
        { align: "right" }
      );
    }

    doc.save(`donaciones_${toDateInputValue(new Date())}.pdf`);
  }

  async function exportExcelXLS(){
    const list = filteredDonations?.length ? filteredDonations : allDonations;
    if (!list || list.length === 0){
      setStatus("No hay datos para exportar.");
      return;
    }

    const logoData = await fetchLogoDataURL(); // base64 (si falla, solo no sale el logo)

    const head = `
      <tr>
        <th>ID</th>
        <th>Nombre</th>
        <th>Teléfono</th>
        <th>Correo</th>
        <th>Monto</th>
        <th>Método</th>
        <th>Mensaje</th>
        <th>Fecha</th>
      </tr>
    `;

    const rows = list.map(d => `
      <tr>
        <td>${esc(d.id)}</td>
        <td>${esc(d.name)}</td>
        <td>${esc(d.phone)}</td>
        <td>${esc(d.email)}</td>
        <td>${esc(formatMoneyMXN(d.amount))}</td>
        <td>${esc(d.payment_method || "")}</td>
        <td>${esc(d.message)}</td>
        <td>${esc(d.created_at)}</td>
      </tr>
    `).join("");

    const now = new Date().toLocaleString("es-MX");

    // XLS HTML: Excel lo abre y respeta estilos básicos + logo (si base64 disponible)
    const html = `
      <html>
      <head>
        <meta charset="utf-8" />
        <style>
          body{ font-family: Arial; }
          .hdr{ display:flex; align-items:center; gap:12px; margin-bottom:14px; }
          .t1{ font-size: 18px; font-weight: 700; }
          .t2{ font-size: 12px; color:#445; margin-top:2px; }
          .meta{ font-size: 12px; color:#555; margin: 8px 0 14px; }
          table{ border-collapse: collapse; width:100%; }
          th,td{ border:1px solid #ddd; padding:8px; font-size:12px; vertical-align: top; }
          th{ background:#f4f6fb; font-weight:700; }
          .foot{ margin-top:14px; font-size: 11px; color:#666; }
        </style>
      </head>
      <body>
        <div class="hdr">
          ${logoData ? `<img src="${logoData}" width="52" height="52" />` : ``}
          <div>
            <div class="t1">Casa del Migrante</div>
            <div class="t2">Mons. Guillermo Ranzahuer González</div>
          </div>
        </div>

        <div class="meta">
          <b>Reporte de donaciones</b><br/>
          Generado: ${esc(now)}
        </div>

        <table>
          <thead>${head}</thead>
          <tbody>${rows}</tbody>
        </table>

        <div class="foot">
          Datos internos — Casa del Migrante Mons. Guillermo Ranzahuer González.
        </div>
      </body>
      </html>
    `;

    const blob = new Blob([html], { type: "application/vnd.ms-excel;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `donaciones_${toDateInputValue(new Date())}.xls`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  // Eventos
  refreshBtn?.addEventListener("click", async () => {
    await loadStats();
    await loadDonations();
  });

  logoutBtn?.addEventListener("click", async () => {
    await fetch("/api/logout", { method: "POST" });
    window.location.href = "/login.html";
  });

  applyFilterBtn?.addEventListener("click", applyFilter);
  clearFilterBtn?.addEventListener("click", clearFilter);

  exportPdfBtn?.addEventListener("click", exportPDF);
  exportXlsBtn?.addEventListener("click", exportExcelXLS);

  // Init
  (async () => {
    const ok = await requireAuth();
    if (!ok) return;

    await loadStats();
    await loadDonations();

    // Sugerencia: por si quieres “mes actual” por default, descomenta:
    // if (monthFilter) monthFilter.value = String(new Date().getMonth());
    // applyFilter();
  })();
})();