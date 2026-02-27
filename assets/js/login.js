/* =========================================================
   login.js (POSTGRES + SESSION)
   - Hace login real contra /api/login
   - Usuario: admin
   - Password: Demo123!
   - Redirige a dashboard.html si ok
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");
  const userEl = document.getElementById("username");
  const passEl = document.getElementById("password");
  const msgEl  = document.getElementById("loginMsg");

  if (!form || !userEl || !passEl) {
    console.error("Login: faltan elementos del formulario (IDs).");
    if (msgEl) msgEl.textContent = "Error: el formulario no está listo.";
    return;
  }

  const setMsg = (text, type = "info") => {
    if (!msgEl) return;
    msgEl.textContent = text;
    const colors = {
      info: "rgba(20,36,70,.70)",
      ok: "rgba(16,120,82,.90)",
      err: "rgba(185,28,28,.90)",
    };
    msgEl.style.color = colors[type] || colors.info;
  };

  setMsg("");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = (userEl.value || "").trim();
    const password = (passEl.value || "").trim();

    if (!username || !password) {
      setMsg("Escribe usuario y contraseña.", "err");
      return;
    }

    setMsg("Validando credenciales…", "info");

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // ✅ clave para que guarde cookie/sesión
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setMsg(data?.error || "Usuario o contraseña incorrectos.", "err");
        return;
      }

      const data = await res.json().catch(() => ({}));
      setMsg("Acceso correcto. Entrando…", "ok");

      // (Opcional) solo para UI, ya no dependemos de esto para seguridad
      localStorage.setItem("cm_admin_logged", "1");
      localStorage.setItem("cm_admin_user", data?.user || username);

      window.location.href = "dashboard.html";
    } catch (err) {
      console.error(err);
      setMsg("Error de conexión con el servidor. ¿Está corriendo el server?", "err");
    }
  });
});