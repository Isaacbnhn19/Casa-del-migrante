// server/routes/donations.routes.js
import express from "express";
import { query } from "../db.js";

const router = express.Router();

/** Middleware simple para proteger rutas (admin logueado) */
function requireAuth(req, res, next) {
  if (req.session?.admin?.id) return next();
  return res.status(401).json({ error: "No autorizado" });
}

/** ✅ POST público: registrar donación (DEMO) */
router.post("/donations", async (req, res) => {
  try {
    const { name, phone, email, amount, message, payment_method } = req.body || {};

    // Validación mínima
    if (!name || String(name).trim().length < 2) {
      return res.status(400).json({ error: "Nombre inválido." });
    }
    const numAmount = Number(amount);
    if (!Number.isFinite(numAmount) || numAmount <= 0) {
      return res.status(400).json({ error: "Monto inválido." });
    }

    const method = String(payment_method || "no_definido").trim();

    const sql = `
      INSERT INTO donations (name, phone, email, amount, message, payment_method, created_at)
      VALUES ($1,$2,$3,$4,$5,$6, NOW())
      RETURNING id, name, phone, email, amount, message, payment_method, created_at
    `;
    const params = [
      String(name).trim(),
      phone ? String(phone).trim() : null,
      email ? String(email).trim() : null,
      numAmount,
      message ? String(message).trim() : null,
      method,
    ];

    const r = await query(sql, params);
    return res.status(201).json({ ok: true, donation: r.rows[0] });
  } catch (err) {
    console.error("POST /api/donations error:", err);
    return res.status(500).json({ error: "Error registrando donación." });
  }
});

/** ✅ GET protegido: listado (dashboard) */
router.get("/donations", requireAuth, async (req, res) => {
  try {
    const r = await query(
      `SELECT id, name, phone, email, amount, message, payment_method, created_at
       FROM donations
       ORDER BY created_at DESC
       LIMIT 500`
    );
    res.json(r.rows);
  } catch (err) {
    console.error("GET /api/donations error:", err);
    res.status(500).json({ error: "Error cargando donaciones." });
  }
});

/** ✅ GET protegido: stats (dashboard) */
router.get("/donations/stats", requireAuth, async (req, res) => {
  try {
    const r = await query(`
      SELECT
        COUNT(*)::int AS total_donations,
        COALESCE(SUM(amount), 0)::numeric AS total_amount,
        NOW() AS server_time
      FROM donations
    `);
    res.json(r.rows[0]);
  } catch (err) {
    console.error("GET /api/donations/stats error:", err);
    res.status(500).json({ error: "Error cargando stats." });
  }
});

export default router;