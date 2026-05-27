import { drizzle } from "drizzle-orm/node-postgres";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

// Lazy init: Next.js touches every route's module graph at build time to
// collect static data. Eagerly opening a Pool throws "DATABASE_URL not set"
// during build in CI environments that don't ship the secret. Initialise on
// first real request instead.

const globalForDb = globalThis as unknown as {
  __pgPool?: Pool;
  __drizzle?: NodePgDatabase<typeof schema>;
};

function getPool(): Pool {
  if (globalForDb.__pgPool) return globalForDb.__pgPool;
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Add it to .env.local (see .env.local.example).",
    );
  }
  const pool = new Pool({ connectionString, max: 5 });
  pool.on("error", (e) => {
    // Surfaces idle-client failures so a dead conn doesn't silently rot the
    // pool. Per project convention: never silent-catch.
    console.error("[db] pool idle error:", e);
  });
  globalForDb.__pgPool = pool;
  return pool;
}

function getDb(): NodePgDatabase<typeof schema> {
  if (globalForDb.__drizzle) return globalForDb.__drizzle;
  const client = drizzle(getPool(), { schema });
  globalForDb.__drizzle = client;
  return client;
}

// Proxy so `db.query.xxx` and `db.insert(...)` work without callers ever
// touching the lazy getter. Each property access lazily resolves the real
// drizzle client; misses on the prototype (e.g. Symbol.toPrimitive) fall
// through cleanly.
export const db: NodePgDatabase<typeof schema> = new Proxy(
  {} as NodePgDatabase<typeof schema>,
  {
    get(_, prop, receiver) {
      const real = getDb();
      const value = Reflect.get(real, prop, receiver);
      return typeof value === "function" ? value.bind(real) : value;
    },
  },
);

export { schema };
