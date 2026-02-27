// server/scripts/create-admin.js
// Crea/actualiza el usuario admin en PostgreSQL (ESM compatible)
// Ejecuta: node scripts/create-admin.js  (desde /server)

import "dotenv/config";
import bcrypt from "bcryptjs";
import pg from "pg";

const { Pool } = pg;

// Lee variables del .env
const {
  DATABASE_URL,
  PGHOST,
  PGPORT,
  PGUSER,
  PGPASSWORD,
  PGDATABASE,
  ADMIN_USER = "admin",
  ADMIN_PASS = "Demo123!",
} = process.env;

function getPool() {
  // 1) Si hay DATABASE_URL, úsala
  if (DATABASE_URL) {
    return new Pool({
      connectionString: DATABASE_URL,
      ssl: DATABASE_URL.includes("sslmode=require")
        ? { rejectUnauthorized: false }
        : undefined,
    });
  }

  // 2) Si no, usa variables sueltas
  return new Pool({
    host: PGHOST || "localhost",
    port: Number(PGPORT || 5432),
    user: PGUSER || "postgres",
    password: PGPASSWORD || "",
    database: PGDATABASE || "postgres",
  });
}

async function ensureAdminsTable(pool) {
  // Tabla admins mínima (si no existe la crea)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS admins (
      id SERIAL PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  // Trigger opcional para updated_at (si quieres)
  await pool.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_admins'
      ) THEN
        CREATE OR REPLACE FUNCTION set_updated_at()
        RETURNS TRIGGER AS $f$
        BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
        END;
        $f$ LANGUAGE plpgsql;

        CREATE TRIGGER set_updated_at_admins
        BEFORE UPDATE ON admins
        FOR EACH ROW
        EXECUTE FUNCTION set_updated_at();
      END IF;
    END $$;
  `);
}

async function upsertAdmin(pool, username, password) {
  const hash = await bcrypt.hash(password, 12);

  // UPSERT
  await pool.query(
    `
    INSERT INTO admins (username, password_hash)
    VALUES ($1, $2)
    ON CONFLICT (username)
    DO UPDATE SET password_hash = EXCLUDED.password_hash;
    `,
    [username, hash]
  );
}

(async () => {
  const pool = getPool();

  try {
    await ensureAdminsTable(pool);
    await upsertAdmin(pool, ADMIN_USER, ADMIN_PASS);

    console.log("✅ Admin creado/actualizado en PostgreSQL:");
    console.log("   user:", ADMIN_USER);
    console.log("   pass:", ADMIN_PASS);
    console.log("   (Puedes cambiarlo en tu .env con ADMIN_USER y ADMIN_PASS)");
  } catch (err) {
    console.error("❌ Error creando admin:", err?.message || err);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
})();