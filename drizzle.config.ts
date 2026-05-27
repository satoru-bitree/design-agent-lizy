import type { Config } from "drizzle-kit";
import { loadEnvConfig } from "@next/env";

// drizzle-kit runs as its own CLI process — Next.js's auto-loading of
// .env.local doesn't apply. Replicate Next's loader so `DATABASE_URL` from
// .env.local works for `db:push` / `db:migrate` without manually exporting.
loadEnvConfig(process.cwd());

export default {
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
  strict: true,
} satisfies Config;
