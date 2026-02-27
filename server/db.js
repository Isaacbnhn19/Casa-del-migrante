// server/db.js (ESM)
// Pool PostgreSQL reutilizable para toda la app

import "dotenv/config";
import pg from "pg";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error("Falta DATABASE_URL en el .env (DATABASE_URL)");
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Helper opcional
export function query(text, params) {
  return pool.query(text, params);
}