// server/server.js (ESM)
// API + sesión en PostgreSQL + login admin + donaciones

import "dotenv/config";
import express from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import bcrypt from "bcryptjs";
import path from "path";
import { fileURLToPath } from "url";

import { pool } from "./db.js"; // ✅ usamos UN SOLO pool

const PgSession = connectPgSimple(session);
const app = express();

const PORT = Number(process.env.PORT || 3000);
const SESSION_SECRET = process.env.SESSION_SECRET || "change_me";

// --- Paths ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Middleware base ---
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

// Sirve tu web (index.html, login.html, dashboard.html, etc.)
const WEB_ROOT = path.resolve(__dirname, "..");
app.use(express.static(WEB_ROOT));

// --- Sesión guardada en PostgreSQL ---
app.use(
  session({
    store: new PgSession({
      pool,
      tableName: "session",
      createTableIfMissing: true,
    }),
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: false, // localhost: false
      maxAge: 1000 * 60 * 60 * 8, // 8 horas
    },
  })
);

// --- Helper Auth ---
function requireAuth(req, res, next) {
  if (req.session?.user?.role === "admin") return next();
  return res.status(401).json({ error: "No autorizado" });
}

// --- Health check ---
app.get("/api/health", (_req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

// ======================================================
// LOGIN
// ======================================================
app.post("/api/login", async (req, res) => {
  try {
    const username = String(req.body.username || "").trim();
    const password = String(req.body.password || "");

    if (!username || !password) {
      return res.status(400).json({ error: "Faltan credenciales" });
    }

    const q = await pool.query(
      "SELECT id, username, password_hash FROM admins WHERE username = $1 LIMIT 1",
      [username]
    );

    if (q.rowCount === 0) {
      return res.status(401).json({ error: "Usuario o contraseña incorrectos" });
    }

    const admin = q.rows[0];
    const ok = await bcrypt.compare(password, admin.password_hash);

    if (!ok) {
      return res.status(401).json({ error: "Usuario o contraseña incorrectos" });
    }

    // ✅ Guarda sesión
    req.session.user = { id: admin.id, username: admin.username, role: "admin" };

    return res.json({ ok: true });
  } catch (err) {
    console.error("❌ /api/login error:", err);
    return res.status(500).json({ error: "Error del servidor" });
  }
});

app.post("/api/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ ok: true });
  });
});

app.get("/api/me", (req, res) => {
  if (req.session?.user?.role === "admin") {
    return res.json({ ok: true, user: req.session.user });
  }
  return res.status(401).json({ ok: false });
});

// ======================================================
// DONACIONES
// - POST: público (registrar donación desde donar.html)
// - GET: admin (dashboard)
// - STATS: público (tú lo dejaste público)
// ======================================================

app.get("/api/donations", requireAuth, async (_req, res) => {
  try {
    const q = await pool.query(
      `SELECT id, name, phone, email, amount, message, payment_method, created_at
       FROM donations
       ORDER BY created_at DESC`
    );
    res.json(q.rows);
  } catch (err) {
    console.error("❌ /api/donations GET error:", err);
    res.status(500).json({ error: "Error cargando donaciones" });
  }
});

app.get("/api/donations/stats", async (_req, res) => {
  try {
    const q = await pool.query(`
      SELECT
        COUNT(*)::int AS total_donations,
        COALESCE(SUM(amount), 0)::numeric AS total_amount
      FROM donations
    `);

    res.json({
      total_donations: q.rows[0].total_donations,
      total_amount: q.rows[0].total_amount,
      server_time: new Date().toISOString(),
    });
  } catch (err) {
    console.error("❌ /api/donations/stats error:", err);
    res.status(500).json({ error: "Error stats" });
  }
});

// ✅ Registro público de donación (DEMO)
app.post("/api/donations", async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    const phone = String(req.body.phone || "").trim();
    const email = String(req.body.email || "").trim();
    const message = String(req.body.message || "").trim();
    const amount = Number(req.body.amount || 0);

    // opcional (si mandas método desde donar.html)
    const payment_method = String(req.body.payment_method || "").trim() || null;

    if (!name || !email || !amount || amount <= 0) {
      return res.status(400).json({ error: "Datos incompletos" });
    }

    const q = await pool.query(
      `INSERT INTO donations (name, phone, email, amount, message, payment_method, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       RETURNING id, created_at`,
      [name, phone, email, amount, message, payment_method]
    );

    res.json({
      ok: true,
      donation_id: q.rows[0].id,
      created_at: q.rows[0].created_at,
    });
  } catch (err) {
    console.error("❌ /api/donations POST error:", err);
    res.status(500).json({ error: "Error registrando donación" });
  }
});

// ======================================================
// Fallback: servir index.html si abren "/"
// ======================================================
app.get("/", (_req, res) => {
  res.sendFile(path.join(WEB_ROOT, "index.html"));
});

app.listen(PORT, () => {
  console.log(`✅ Server corriendo en http://localhost:${PORT}`);
});