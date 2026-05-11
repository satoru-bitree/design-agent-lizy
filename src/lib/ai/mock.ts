// Mock AI provider — realistic delays + plausible fixtures.
// State-free: job progress derived from elapsed time encoded into the jobId.
// Drop-in replacement for the future real provider (same interface).

import {
  ARIA_GUIDE,
  SEMPIO_GUIDE,
  YONDU_GUIDE,
  type BrandGuide,
} from "@/lib/mock-data";
import type { AIProvider } from "./provider";
import {
  AIError,
  type BrandExtractionInput,
  type BrandExtractionResult,
  type GenerationInput,
  type Job,
  type JobKind,
  type JobVariant,
} from "./types";

const ANALYSIS_DELAY_MS = { min: 1500, max: 2800 };
const ANALYSIS_FAIL_RATE = 0; // bump to 0.05 once retry UX is in place

const GEN_DURATIONS_MS: Record<JobKind, { min: number; max: number }> = {
  package: { min: 6000, max: 9000 },
  style_shot: { min: 4500, max: 7000 },
  short_video: { min: 18000, max: 26000 },
};

// Revisions are scoped tweaks of an existing result — feel snappier.
const REVISION_DURATIONS_MS: Record<JobKind, { min: number; max: number }> = {
  package: { min: 2500, max: 4000 },
  style_shot: { min: 2000, max: 3500 },
  short_video: { min: 8000, max: 14000 },
};

const FIXTURES: { match: RegExp; guide: BrandGuide }[] = [
  { match: /sempio|샘표/i, guide: SEMPIO_GUIDE },
  { match: /yondu|연두/i, guide: YONDU_GUIDE },
  { match: /aria|아리아|tech/i, guide: ARIA_GUIDE },
];

const ALL_FIXTURES = [SEMPIO_GUIDE, YONDU_GUIDE, ARIA_GUIDE];

function pickFixture(fileName: string): BrandGuide {
  for (const f of FIXTURES) {
    if (f.match.test(fileName)) return f.guide;
  }
  return ALL_FIXTURES[Math.floor(Math.random() * ALL_FIXTURES.length)];
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function jitter({ min, max }: { min: number; max: number }): number {
  return min + Math.random() * (max - min);
}

function makeJobId(
  kind: JobKind,
  durations: Record<JobKind, { min: number; max: number }> = GEN_DURATIONS_MS,
): string {
  const ts = Date.now();
  const dur = Math.round(jitter(durations[kind]));
  const rnd = Math.random().toString(36).slice(2, 8);
  return `${kind}__${ts}__${dur}__${rnd}`;
}

function readJobMeta(
  jobId: string,
): { kind: JobKind; startTs: number; duration: number } | null {
  const parts = jobId.split("__");
  if (parts.length < 4) return null;
  const kind = parts[0] as JobKind;
  if (!["package", "style_shot", "short_video"].includes(kind)) return null;
  const startTs = Number(parts[1]);
  const duration = Number(parts[2]);
  if (!Number.isFinite(startTs) || !Number.isFinite(duration)) return null;
  return { kind, startTs, duration };
}

const pic = (seed: string, w: number, h: number) =>
  `https://picsum.photos/seed/${seed}/${w}/${h}`;

function jobVariants(kind: JobKind): JobVariant[] {
  switch (kind) {
    case "package":
      return [
        {
          id: "pkg-label",
          url: pic("yondu-label", 800, 600),
          label: "라벨 v1",
          description: "평면 라벨 아트워크",
        },
      ];
    case "style_shot":
      return [
        {
          id: "style-product",
          url: pic("yondu-product-detail", 400, 400),
          label: "스타일 1",
          description: "스튜디오 화이트",
        },
        {
          id: "style-sns",
          url: pic("yondu-sns-feed", 400, 400),
          label: "스타일 2",
          description: "라이프스타일 컷",
        },
      ];
    case "short_video":
      return [
        {
          id: "video-vert",
          url: pic("yondu-chef", 360, 640),
          label: "셰프 브이로그",
          description: "30초 시즌 컷",
          meta: {
            platforms: "틱톡 / 릴스 / 쇼츠",
            ratio: "9:16",
            duration: "30s",
            export: "4K Export",
          },
        },
      ];
  }
}

class MockProvider implements AIProvider {
  async extractBrandGuide(
    input: BrandExtractionInput,
  ): Promise<BrandExtractionResult> {
    await sleep(jitter(ANALYSIS_DELAY_MS));
    if (Math.random() < ANALYSIS_FAIL_RATE) {
      throw new AIError(
        "EXTRACTION_FAILED",
        "분석에 실패했습니다. 다시 시도해주세요.",
      );
    }
    return {
      brandGuide: pickFixture(input.fileName),
      confidence: { logo: 0.93, palette: 0.88, typography: 0.74, mood: 0.81 },
    };
  }

  async startGeneration(
    kind: JobKind,
    input: GenerationInput,
  ): Promise<{
    jobId: string;
    uploads?: { product?: string; reference?: string };
  }> {
    await sleep(120 + Math.random() * 180);
    const durations = input.revision ? REVISION_DURATIONS_MS : GEN_DURATIONS_MS;
    return { jobId: makeJobId(kind, durations) };
  }

  async getJob(jobId: string): Promise<Job | null> {
    const meta = readJobMeta(jobId);
    if (!meta) return null;
    const elapsed = Date.now() - meta.startTs;
    const queueWindow = 400;

    if (elapsed < queueWindow) {
      return {
        id: jobId,
        kind: meta.kind,
        status: "queued",
        progress: 0,
        startedAt: meta.startTs,
      };
    }
    if (elapsed < meta.duration) {
      const progress = Math.min(
        0.99,
        (elapsed - queueWindow) / (meta.duration - queueWindow),
      );
      return {
        id: jobId,
        kind: meta.kind,
        status: "running",
        progress,
        startedAt: meta.startTs,
      };
    }
    return {
      id: jobId,
      kind: meta.kind,
      status: "succeeded",
      progress: 1,
      result: { variants: jobVariants(meta.kind) },
      startedAt: meta.startTs,
    };
  }
}

export const mockProvider: AIProvider = new MockProvider();
