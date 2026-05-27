import {
  pgTable,
  text,
  jsonb,
  real,
  bigint,
  timestamp,
} from "drizzle-orm/pg-core";
import type { AssetType, BrandGuide } from "@/lib/mock-data";
import type {
  Job,
  StyleShotSettings,
  ShortVideoSettings,
} from "@/lib/ai/types";

/* -------------------------------------------------------------------------- */
/* Persisted brand state                                                      */
/* -------------------------------------------------------------------------- */

// Mirrors `stripBrandImages(state.brand)` in jobs-store — only the bits that
// survive a refresh today (logo.result + per-section text/applied/result).
// One singleton row keyed by id='current' so we don't pay schema churn every
// time the BrandState shape gains a field.
export type BrandPersisted = {
  logo: {
    result: import("@/lib/stores/jobs-store").BrandLogoResult | null;
  };
  palette: {
    text: string;
    applied: string;
    result: { hex: string; name?: string }[];
  };
  typography: {
    text: string;
    applied: string;
    result: { heading: string; body: string } | null;
  };
  mood: { text: string; applied: string; result: string };
};

export const brandState = pgTable("brand_state", {
  id: text("id").primaryKey(),
  data: jsonb("data").$type<BrandPersisted>().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

/* -------------------------------------------------------------------------- */
/* Projects                                                                   */
/* -------------------------------------------------------------------------- */

// Lightweight persistent product/reference shape — strip dataUrl/objectUrl,
// keep remoteUrl (fal CDN URL) so revisions can run after a refresh.
export type ProductAssetPersisted = {
  fileName: string;
  fileSize: number;
  remoteUrl?: string;
};

export type ReferenceAssetPersisted = {
  fileName: string;
  remoteUrl?: string;
};

export const projects = pgTable("projects", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  market: text("market").notNull(),
  brandMessage: text("brand_message").notNull(),
  brandGuide: jsonb("brand_guide").$type<BrandGuide>().notNull(),
  product: jsonb("product").$type<ProductAssetPersisted>().notNull(),
  references: jsonb("references").$type<
    Partial<Record<AssetType, ReferenceAssetPersisted>>
  >(),
  assetTypes: jsonb("asset_types").$type<AssetType[]>().notNull(),
  styleShotSettings: jsonb("style_shot_settings").$type<StyleShotSettings>(),
  shortVideoSettings: jsonb("short_video_settings").$type<ShortVideoSettings>(),
  jobIds: jsonb("job_ids")
    .$type<Partial<Record<AssetType, string>>>()
    .notNull(),
  startErrors: jsonb("start_errors")
    .$type<Partial<Record<AssetType, string>>>()
    .notNull(),
  // Original createdAt is Date.now() (ms). Keep as bigint so the client can
  // continue to sort/format with the same millis it always used.
  createdAt: bigint("created_at", { mode: "number" }).notNull(),
});

/* -------------------------------------------------------------------------- */
/* Jobs (cache of latest poll result)                                         */
/* -------------------------------------------------------------------------- */

// We don't OWN job execution — fal does. This table caches the last poll
// result so the UI can render last-known state on first paint (before polling
// resumes) and so terminal states (succeeded/failed) don't have to re-hit fal.
export const jobs = pgTable("jobs", {
  id: text("id").primaryKey(),
  kind: text("kind").$type<Job["kind"]>().notNull(),
  status: text("status").$type<Job["status"]>().notNull(),
  progress: real("progress").notNull(),
  result: jsonb("result").$type<NonNullable<Job["result"]>>(),
  error: text("error"),
  startedAt: bigint("started_at", { mode: "number" }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type ProjectRow = typeof projects.$inferSelect;
export type JobRow = typeof jobs.$inferSelect;
export type BrandStateRow = typeof brandState.$inferSelect;
