// Single swap point. UI / routes / stores never change.
//
// AI_MODE env var (server-only) decides per-call routing. Accepted values:
//
//   AI_MODE=mock                → all mock (zero token spend)
//   AI_MODE=fal                 → all fal (errors at call time if FAL_KEY missing)
//   AI_MODE=<kinds>             → comma-separated list of items below; only
//                                 listed items use fal, everything else mock
//                                   • package        (라벨 / 패키지 디자인)
//                                   • style_shot    (스타일 샷)
//                                   • short_video   (숏폼 영상)
//                                   • brand         (브랜드 가이드 분석)
//   AI_MODE unset / blank        → fal everywhere if FAL_KEY is set, else mock
//
// Examples:
//   AI_MODE=style_shot                    # only style-shot generation hits fal
//   AI_MODE=package,brand                 # label generation + brand analysis hit fal
//   AI_MODE=package,style_shot,short_video,brand  # equivalent to AI_MODE=fal
//
// Set in .env.local. Restart `next dev` for changes to take effect.

import { makeHybridProvider, type HybridConfig, type Target } from "./hybrid";
import type { AIProvider } from "./provider";
import type { JobKind } from "./types";

const ALL_KINDS: JobKind[] = ["package", "style_shot", "short_video"];
const KIND_TOKENS = new Set<string>([...ALL_KINDS, "brand"]);

function resolveConfig(): HybridConfig {
  const mode = (process.env.AI_MODE ?? "").toLowerCase().trim();
  const hasKey = !!process.env.FAL_KEY;

  // All-mock shortcuts
  if (mode === "mock" || (mode === "" && !hasKey)) {
    return all("mock");
  }
  // All-fal shortcuts
  if (mode === "fal" || mode === "") {
    return all("fal");
  }
  // Comma-separated allowlist
  const tokens = new Set(
    mode
      .split(",")
      .map((s) => s.trim())
      .filter((s) => KIND_TOKENS.has(s)),
  );
  return {
    brand: tokens.has("brand") ? "fal" : "mock",
    generation: {
      package: tokens.has("package") ? "fal" : "mock",
      style_shot: tokens.has("style_shot") ? "fal" : "mock",
      short_video: tokens.has("short_video") ? "fal" : "mock",
    },
  };
}

function all(target: Target): HybridConfig {
  return {
    brand: target,
    generation: { package: target, style_shot: target, short_video: target },
  };
}

export const ai: AIProvider = makeHybridProvider(resolveConfig());

export type { AIProvider };
export * from "./types";
