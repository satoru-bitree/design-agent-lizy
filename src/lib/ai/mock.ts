// Mock AI provider — realistic delays + plausible fixtures.
// State-free: job progress derived from elapsed time encoded into the jobId.
// Drop-in replacement for the future real provider (same interface).

import {
  ARIA_GUIDE,
  SEMPIO_GUIDE,
  YONDU_GUIDE,
  type BrandGuide,
} from "@/lib/mock-data";
import {
  parseMoodText,
  parsePaletteText,
  parseTypographyText,
} from "@/lib/brand-section-parse";
import { isAllowedFont } from "@/lib/font-loader";
import type { AIProvider } from "./provider";
import {
  AIError,
  type BrandExtractionInput,
  type BrandExtractionResult,
  type BrandSectionInterpretInput,
  type BrandSectionInterpretResult,
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

/* -------------------------------------------------------------------------- */
/* Mock natural-language interpretation                                       */
/* -------------------------------------------------------------------------- */

type PaletteSwatch = { hex: string; name?: string };
type MoodPreset = {
  match: RegExp;
  palette: PaletteSwatch[];
  fonts: { heading: string; body: string };
  caption: string;
};

// Mood presets — match Korean and English keywords to a hand-picked palette,
// font pairing, and caption. First match wins; fall through to a generic
// preset if nothing matches. Keeps the offline experience usable when
// FAL_KEY is missing.
const MOOD_PRESETS: MoodPreset[] = [
  {
    match: /가을|단풍|autumn|fall|warm earth|토속|herit|전통|artisan/i,
    palette: [
      { hex: "#C9633B", name: "Maple" },
      { hex: "#E9C46A", name: "Honey" },
      { hex: "#2A2118", name: "Walnut" },
    ],
    fonts: { heading: "Playfair Display", body: "Playfair Display" },
    caption: "ARTISAN HERITAGE",
  },
  {
    match: /luxury|고급|프리미엄|premium|에르메스|샤넬|hermes|chanel|black\s*tie/i,
    palette: [
      { hex: "#0A0A0A", name: "Onyx" },
      { hex: "#D4AF7F", name: "Champagne" },
      { hex: "#F4F1EC", name: "Ivory" },
    ],
    fonts: { heading: "Bodoni Moda", body: "Bodoni Moda" },
    caption: "QUIET LUXURY",
  },
  {
    match: /tech|디지털|digital|saas|미니멀|minimal|crisp|clean|모던|modern/i,
    palette: [
      { hex: "#0F172A", name: "Obsidian" },
      { hex: "#3B82F6", name: "Signal" },
      { hex: "#FAFAFA", name: "Snow" },
    ],
    fonts: { heading: "Inter", body: "Inter" },
    caption: "DIGITAL CLARITY",
  },
  {
    match: /자연|nature|organic|fresh|식물|leaf|botanical|친환경|eco/i,
    palette: [
      { hex: "#3FA66E", name: "Leaf" },
      { hex: "#F4F1DE", name: "Cream" },
      { hex: "#264653", name: "Forest" },
    ],
    fonts: { heading: "Manrope", body: "Manrope" },
    caption: "FRESH ESSENCE",
  },
  {
    match: /따뜻|warm|친근|friendly|코지|cozy|아늑|soft pastel/i,
    palette: [
      { hex: "#F4B5C0", name: "Blush" },
      { hex: "#F4D35E", name: "Butter" },
      { hex: "#8B5A3C", name: "Cocoa" },
    ],
    fonts: { heading: "DM Sans", body: "DM Sans" },
    caption: "WARM COMFORT",
  },
  {
    match: /오션|바다|coastal|marine|시원|cool|시리얼|crisp blue/i,
    palette: [
      { hex: "#1D3557", name: "Deep Blue" },
      { hex: "#A8DADC", name: "Lagoon" },
      { hex: "#F1FAEE", name: "Bone" },
    ],
    fonts: { heading: "Manrope", body: "Manrope" },
    caption: "COASTAL CLARITY",
  },
  {
    match: /빈티지|vintage|레트로|retro|nostalg/i,
    palette: [
      { hex: "#D9A441", name: "Brass" },
      { hex: "#2E2A26", name: "Espresso" },
      { hex: "#F4E5C7", name: "Parchment" },
    ],
    fonts: { heading: "Lora", body: "Lora" },
    caption: "VINTAGE NOTES",
  },
];

const DEFAULT_PRESET: MoodPreset = {
  match: /.^/,
  palette: [
    { hex: "#0A0A0A", name: "Ink" },
    { hex: "#5DBE8D", name: "Mint" },
    { hex: "#F4F1DE", name: "Cream" },
  ],
  fonts: { heading: "Inter", body: "Inter" },
  caption: "BRAND MOOD",
};

function pickPreset(text: string): MoodPreset {
  return MOOD_PRESETS.find((p) => p.match.test(text)) ?? DEFAULT_PRESET;
}

/** Mock natural-language interpretation. Tries deterministic parsers first
 *  (so users typing hex codes or exact font names get exact output), then
 *  falls back to a keyword-driven mood preset. */
function interpretBrandSectionMock(
  input: BrandSectionInterpretInput,
): BrandSectionInterpretResult {
  const text = input.text.trim();
  if (input.section === "palette") {
    const literal = parsePaletteText(text);
    if (literal.length > 0) return { section: "palette", palette: literal };
    return { section: "palette", palette: pickPreset(text).palette };
  }
  if (input.section === "typography") {
    // Only honor a literal parse if every family lands in the Google Fonts
    // allowlist — otherwise a natural-language phrase like "고급스러운 세리프"
    // gets stamped onto BrandGuide.typography and the preview renders in a
    // missing font.
    const literal = parseTypographyText(text);
    if (literal && isAllowedFont(literal.heading) && isAllowedFont(literal.body)) {
      return { section: "typography", typography: literal };
    }
    return { section: "typography", typography: pickPreset(text).fonts };
  }
  // mood: short caption. If user typed something descriptive, summarize via
  // the preset; otherwise just upper-case their text.
  const base = parseMoodText(text);
  if (!base) return { section: "mood", moodCaption: pickPreset(text).caption };
  // If the user typed a phrase like "ARTISAN HERITAGE", keep it. Otherwise
  // hand back the preset caption — it reads better than "따뜻한 가을 톤".
  const looksLikeCaption = /^[A-Z0-9\s&·.-]{3,40}$/.test(base);
  if (looksLikeCaption) return { section: "mood", moodCaption: base };
  return { section: "mood", moodCaption: pickPreset(text).caption };
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

  async interpretBrandSection(
    input: BrandSectionInterpretInput,
  ): Promise<BrandSectionInterpretResult> {
    await sleep(jitter({ min: 400, max: 900 }));
    return interpretBrandSectionMock(input);
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
