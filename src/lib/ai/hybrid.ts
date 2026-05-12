// Hybrid provider — routes each call to either fal or mock based on a
// per-call config map. Used when the dev wants to test ONE generation kind
// against the real API while keeping the others on free fixtures.
//
// Selection lives in src/lib/ai/index.ts (AI_MODE env). This file just
// implements the dispatch.

import { falProvider } from "./fal";
import { mockProvider } from "./mock";
import type { AIProvider } from "./provider";
import type { JobKind } from "./types";

export type Target = "fal" | "mock";

export type HybridConfig = {
  /** Brand-guide vision analysis. */
  brand: Target;
  /** Per-kind generation routing. */
  generation: Record<JobKind, Target>;
};

const pick = (t: Target): AIProvider => (t === "fal" ? falProvider : mockProvider);

export function makeHybridProvider(config: HybridConfig): AIProvider {
  return {
    extractBrandGuide: (input) => pick(config.brand).extractBrandGuide(input),
    interpretBrandSection: (input) =>
      pick(config.brand).interpretBrandSection(input),
    startGeneration: (kind, input) =>
      pick(config.generation[kind]).startGeneration(kind, input),
    getJob: (jobId) => {
      // falProvider.getJob already delegates to mockProvider for non-fal-
      // prefixed ids, so it correctly handles either origin regardless of
      // current config (e.g. job started while mode was "fal" then mode
      // flipped to "mock" — its id still routes to fal for status).
      return falProvider.getJob(jobId);
    },
  };
}
