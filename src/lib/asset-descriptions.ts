// Builds Korean-language descriptions for generated style-shot and short-video
// outputs. Statically synthesized from the project's stored settings (preset /
// concept / market / brand mood / additional request) — no extra AI call.
//
// Trade-off: this describes the INTENT (what we asked for) rather than the
// actual generated image. A future iteration could caption real outputs via a
// vision model, but for v1 the static description is cheap, deterministic, and
// sufficient to answer "what style is this?".

import { SHORT_VIDEO_CONCEPTS, STYLE_SHOT_PRESETS } from "@/lib/ai/types";
import type { GenerationProject } from "@/lib/stores/jobs-store";

export function buildStyleShotDescription(
  project: GenerationProject,
): string | null {
  const presetId = project.styleShotSettings?.preset;
  const presetLabel = presetId
    ? STYLE_SHOT_PRESETS.find((p) => p.id === presetId)?.label
    : "AI 자유 연출";
  const additional = project.styleShotSettings?.additionalRequest?.trim();
  const mood = project.brandGuide.moodCaption;

  const parts: string[] = [];
  parts.push(`${presetLabel} 스타일`);
  if (mood) parts.push(`${mood} 무드`);
  parts.push(`${project.market} 시장 향`);
  if (additional) parts.push(`추가 요청: ${additional}`);
  return parts.join(" · ");
}

export function buildShortVideoDescription(
  project: GenerationProject,
): string | null {
  const conceptId = project.shortVideoSettings?.concept;
  if (!conceptId) return null;
  const conceptMeta = SHORT_VIDEO_CONCEPTS.find((c) => c.id === conceptId);
  if (!conceptMeta) return null;
  const additional = project.shortVideoSettings?.additionalRequest?.trim();
  const mood = project.brandGuide.moodCaption;

  const parts: string[] = [];
  parts.push(`${conceptMeta.label} 컨셉`);
  parts.push(conceptMeta.description);
  parts.push(`${project.market} 시장 향`);
  if (mood) parts.push(`${mood} 무드`);
  if (additional) parts.push(`추가 요청: ${additional}`);
  return parts.join(" · ");
}
