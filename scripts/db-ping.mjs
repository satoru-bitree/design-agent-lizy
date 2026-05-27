// Quick DATABASE_URL connectivity probe. Loads .env.local the way Next does,
// connects with a 5s timeout, runs `SELECT 1`, prints redacted host info.
import nextEnv from "@next/env";
import { Client } from "pg";

nextEnv.loadEnvConfig(process.cwd());

const raw = process.env.DATABASE_URL;
if (!raw) {
  console.error("[db-ping] DATABASE_URL is not set in .env.local");
  process.exit(1);
}

let host = "?";
let port = "?";
let dbName = "?";
try {
  const u = new URL(raw);
  host = u.hostname;
  port = u.port || "(default 5432)";
  dbName = u.pathname.replace(/^\//, "");
} catch {
  console.error("[db-ping] DATABASE_URL is not a valid URL");
  process.exit(1);
}

console.log(`[db-ping] host=${host} port=${port} db=${dbName}`);

const client = new Client({
  connectionString: raw,
  // Fail fast instead of hanging — Drizzle-kit's spinner masks this.
  connectionTimeoutMillis: 5000,
  statement_timeout: 5000,
  query_timeout: 5000,
});

try {
  await client.connect();
  console.log("[db-ping] connected OK");
  const r = await client.query("SELECT 1 AS ok");
  console.log("[db-ping] query OK:", r.rows[0]);
  await client.end();
} catch (e) {
  console.error("[db-ping] failed:", e.code || "", e.message);
  process.exit(2);
}
