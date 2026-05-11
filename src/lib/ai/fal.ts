// fal.ai real provider. Server-only — relies on FAL_KEY in process.env.
//
// Currently wired:
//   - package (label) → openai/gpt-image-2/edit
//   - style_shot      → openai/gpt-image-2/edit
//   - short_video     → bytedance/seedance-2.0/image-to-video
//   - extractBrandGuide → nvidia/nemotron-3-nano-omni/vision
//
// Job tracking: fal.queue.submit returns request_id; we encode kind+model+request_id
// in our own jobId so getJob can poll via fal.queue.status / .result.

import { fal } from "@fal-ai/client";
import { BRAND_FONT_ALLOWLIST } from "@/lib/font-loader";
import { mockProvider } from "./mock";
import type { AIProvider } from "./provider";
import {
  AIError,
  SHORT_VIDEO_CONCEPTS,
  type BrandExtractionInput,
  type BrandExtractionResult,
  type GenerationInput,
  type Job,
  type JobKind,
  type JobVariant,
  type ShortVideoConcept,
  type StyleShotPreset,
} from "./types";

const FAL_KEY = process.env.FAL_KEY;
if (FAL_KEY) {
  fal.config({ credentials: FAL_KEY });
}

// fal's queue API only reports IN_QUEUE / IN_PROGRESS / COMPLETED — no %.
// We synthesize a progress curve from elapsed-vs-estimate so the UI bar moves.
// These are realistic upper-end estimates for gpt-image-2 high-quality with
// two reference images + dense-text prompts (label artwork, Nutrition Facts).
// If actual run is longer, the bar stays at the cap (see below) until fal
// returns COMPLETED.
const ESTIMATED_DURATIONS_MS: Record<JobKind, number> = {
  package: 180_000, // gpt-image-2/edit, dense label text + 2 images, quality:high
  style_shot: 60_000,
  short_video: 180_000, // seedance-2.0 image-to-video
};

// Cap synthesized progress short of full so the user has a visual signal that
// the model is still working past our estimate (instead of stalling at 99%).
const PROGRESS_CAP = 0.92;

const FAL_JOB_PREFIX = "fal__";

// Job state we care about beyond what the id encodes — only `model` for now,
// since we map by kind. Lost on hot reload / cold start, but we recover by
// looking up `modelForKind(kind)` as a fallback in poll.
const jobModel = new Map<string, string>();

// Placeholder for the concept slot when the job has no concept (non-short_video
// kinds, or short_video without an explicit selection). Picked because it's a
// single character that can't collide with a valid ShortVideoConcept id.
const NO_CONCEPT_SLOT = "_";

function makeJobId(
  kind: JobKind,
  startedAt: number,
  requestId: string,
  concept?: ShortVideoConcept,
): string {
  // Embed startedAt so progress estimation survives a server restart / cold
  // start. Embed concept too so the result-label path doesn't depend on an
  // in-memory map (which would be wiped on Next.js hot reload or any second
  // process behind a load balancer). Concept ids contain only single
  // underscores, never the `__` delimiter, so splitting is unambiguous.
  const conceptSlot = concept ?? NO_CONCEPT_SLOT;
  return `${FAL_JOB_PREFIX}${kind}__${startedAt}__${conceptSlot}__${requestId}`;
}

function parseJobId(
  jobId: string,
): {
  kind: JobKind;
  startedAt: number;
  concept?: ShortVideoConcept;
  requestId: string;
} | null {
  if (!jobId.startsWith(FAL_JOB_PREFIX)) return null;
  const rest = jobId.slice(FAL_JOB_PREFIX.length);
  // kind__startedAt__concept__requestId (new format)
  // OR kind__startedAt__requestId (legacy, in-flight jobs from before concept
  // was embedded). Detect by whether the segment after startedAt looks like a
  // concept id (or the placeholder) vs a fal request_id (UUID-style).
  const a = rest.indexOf("__");
  if (a < 0) return null;
  const kind = rest.slice(0, a) as JobKind;
  if (!["package", "style_shot", "short_video"].includes(kind)) return null;
  const afterKind = rest.slice(a + 2);
  const b = afterKind.indexOf("__");
  if (b < 0) return null;
  const startedAt = Number(afterKind.slice(0, b));
  if (!Number.isFinite(startedAt)) return null;
  const afterTs = afterKind.slice(b + 2);

  let concept: ShortVideoConcept | undefined;
  let requestId: string;
  const c = afterTs.indexOf("__");
  if (c < 0) {
    // Legacy format — no concept slot.
    requestId = afterTs;
  } else {
    const conceptSlot = afterTs.slice(0, c);
    const isPlaceholder = conceptSlot === NO_CONCEPT_SLOT;
    const isKnownConcept = SHORT_VIDEO_CONCEPTS.some(
      (sc) => sc.id === conceptSlot,
    );
    if (isPlaceholder || isKnownConcept) {
      // New format with explicit concept slot.
      if (isKnownConcept) concept = conceptSlot as ShortVideoConcept;
      requestId = afterTs.slice(c + 2);
    } else {
      // Looked like new format but the "concept" segment is unrecognized — fall
      // back to treating the whole tail as legacy requestId so a stray `__` in
      // a future fal request_id doesn't blow up parsing.
      requestId = afterTs;
    }
  }

  if (!requestId) return null;
  return { kind, startedAt, concept, requestId };
}

async function uploadDataUrl(dataUrl: string, fileName: string): Promise<string> {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) {
    throw new AIError("INVALID_INPUT", "productImageDataUrl is not a valid base64 dataURL");
  }
  const mime = match[1];
  const buffer = Buffer.from(match[2], "base64");
  // Node 20+ has File / Blob globals.
  const file = new File([buffer], fileName, { type: mime });
  return await fal.storage.upload(file);
}

function buildLabelPrompt(
  input: GenerationInput,
  opts: { hasReference: boolean; productInfo?: ProductInfo } = {
    hasReference: false,
  },
): string {
  const { brandGuide: g, market, brandMessage, revision } = input;
  const palette = g.palette
    .map((p) => `${p.hex}${p.name ? ` (${p.name})` : ""}`)
    .join(", ");
  const brand = g.brandName ?? g.logoWordmark?.text ?? "BRAND";
  const primary = g.palette[0]?.hex ?? "#0A8F4F";
  const secondary = g.palette[1]?.hex ?? "#FFFFFF";
  const lang = languageForMarket(market);
  const info = opts.productInfo;
  const hint = (info?.hint ?? "").trim();
  const wordmark = (info?.productName ?? "").trim();

  const lines: (string | null)[] = [
    `Generate a flat, print-ready CONSUMER PRODUCT LABEL ARTWORK — an unfolded packaging spread laid out as a single horizontal canvas (front panel + side panels visible flat, like a printer's die-line).`,
    `NOT a product mockup. NOT a 3D render. NOT a photograph of the product wearing the label. The output is the flat label artwork itself, ready to be wrapped onto a container.`,
    "",
    `PRODUCT SOURCE OF TRUTH:`,
    `  • Image (1) — the actual product photograph — is the AUTHORITATIVE source of what this product is. Look at it carefully: the dominant color of the contents/label, container shape, any readable text on the existing packaging. Trust what you see in image (1) above all else.`,
    hint ? `  • Auxiliary AI hint (may be wrong, treat as low-confidence): ${hint}` : null,
    wordmark
      ? `  • Most prominent product wordmark/name read off the package: "${wordmark}". Use this verbatim as the visual hero (see CENTER HERO rule below). Do NOT replace it with a translated descriptor.`
      : null,
    `  • Design the label for the product visible in image (1). Match its actual category (a red paste is a red-pepper product, NOT a brown soybean product; a clear liquid is a beverage, NOT a sauce; etc.). Copy ingredient list, usage suggestions, and Nutrition Facts values from what is plausible for THAT category. Do NOT design a label for a different product category just because the AI hint or the style reference suggests one.`,
    "",
    opts.hasReference
      ? `INPUT IMAGES (in order):`
      : null,
    opts.hasReference
      ? `  (1) ACTUAL PRODUCT — the source of truth (see above). Use to determine product category, container shape, current packaging cues, scale.`
      : null,
    opts.hasReference
      ? `  (2) STYLE REFERENCE label — borrow its LAYOUT STRUCTURE only: panel proportions, illustration treatment, design density, where the wordmark / Nutrition Facts / bottom band sit. Do NOT copy the reference's product category, text, brand name, or colors. The reference may show a totally different product (e.g. broth) — the layout DNA is what you take, the product identity comes from image (1).`
      : null,
    !opts.hasReference
      ? `The single input image is the ACTUAL PRODUCT for which we are designing this label. Use it to read container shape, current packaging cues, and product category. Do not paste the product photo onto the canvas; generate a complete original flat label artwork for it.`
      : null,
    "",
    `LAYOUT (single horizontal canvas, brand-color background filling the label, thin white outer margin):`,
    `1) CENTER HERO — the PRODUCT WORDMARK, taken from the source product:`,
    wordmark
      ? `   • The single biggest typographic moment is the product wordmark "${wordmark}" — exactly as it appears on the source product image (verbatim). Render it large, centered, and visually dominant. Keep the same typographic style if it's a logo (e.g. cursive script for "Yondu", clean sans for "Coca-Cola"). Do NOT translate it. Do NOT replace it with a translated descriptor (e.g. "vegetable umami" → "野菜のうま味" is WRONG when the actual wordmark is "Yondu").`
      : `   • The single biggest typographic moment is the PRODUCT NAME, derived from the canonical product identity above (the wordmark on the original package, read verbatim). Use the natural product name as it would appear on real retail packaging — keep the original script (e.g. "Yondu", "고추장", "Olive Oil Extra Virgin"). Render it large, centered, and visually dominant.`,
    wordmark && !isLatinScript(wordmark) && lang.code === "en-US"
      ? `   • Optionally add a small Latin transliteration of "${wordmark}" near the wordmark for the ${lang.label} market.`
      : null,
    wordmark && isLatinScript(wordmark) && lang.code !== "en-US" && lang.code !== "de-DE" && lang.code !== "de-CH" && lang.code !== "fr-FR" && lang.code !== "fr-CH" && lang.code !== "es-ES" && lang.code !== "it-IT"
      ? `   • Keep "${wordmark}" in its original Latin script (do not transliterate fully). Optionally add a small ${lang.label} transliteration above or below the Latin wordmark in much smaller weight (e.g. for Japanese market: "Yondu" with small "ヨンドゥ"; for Korean: "Yondu" with small "연두").`
      : null,
    `   • The brand wordmark "${brand}" (from the brand guide) is SECONDARY. Place it as a small lockup or badge — top-center small lockup above the product wordmark (30–45% the height) OR small badge/seal in the top-left corner. Do NOT make this brand the visual hero. The product wordmark above IS the hero.`,
    `   • Optionally add a short 1–3-word descriptor in the target market language (e.g. "Plant-Based umami" / "植物性うま味" / "Cold-Pressed", "Premium Aged 365 Days", "Vegan", "Gluten-free") near the product wordmark in lighter weight.`,
    `   • A clean illustration framed around the central text block visually communicates the product (ingredients / usage cue) in flat vector or light watercolor style — no photograph.`,
    `2) LEFT INFO PANEL: short marketing intro (1–2 lines), followed by 2–3 short headed sections with 2–3 bullets each ("Rich Flavor" / "Versatile & Easy" / "Suggested uses" — adapt headings to the product category). Headings in the brand primary color, body text in dark neutral. Optional small "Get Inspired" / social handle block at the bottom.`,
    `3) RIGHT INFO PANEL: an FDA-style "Nutrition Facts" (or equivalent for non-food: "Drug Facts" / spec table) black-bordered information panel with plausible, realistic values. Below it: INGREDIENTS list, manufacturer address line, country of origin, website URL, recycling icon, "CONTAINS …" allergen line if applicable.`,
    `4) BOTTOM FULL-WIDTH BAND: colored band using the brand SECONDARY color, showing the flavor / variant name on the left and the net volume on the right (e.g. "9.3 FL OZ (275 mL)").`,
    `5) TOP-LEFT CORNER (outside the colored label area, on the white margin): small muted gray export marker — Korean "수출용", product name, and volume on three short lines.`,
    `6) BOTTOM-RIGHT: a placeholder EAN-13 barcode block.`,
    "",
    `BRAND DIRECTION:`,
    `- Brand: ${brand} — this is the company / product line name. Render it SMALL on the label as a secondary brand mark; do NOT use it as the visual hero. The product name (above) is the hero.`,
    `- Target market: ${market}.`,
    `- OUTPUT LANGUAGE: ALL marketing copy, headings, bullets, "Nutrition Facts" panel labels, ingredient list, manufacturer line, suggested-uses block, allergen line, flavor variant — every piece of text on the label — MUST be written in ${lang.label} (${lang.code}). Do NOT use Korean. Do NOT use English unless ${lang.code} is en-US. Use natural, idiomatic ${lang.label} as it would appear on a real ${lang.label}-language retail product, including market-appropriate units (e.g. ml/g) and number formatting.`,
    `- The ONLY exceptions allowed in non-${lang.code} script: (a) the brand wordmark (Latin); (b) the small Korean "수출용" export marker in the top-left margin; (c) the EAN-13 barcode digits; (d) website URL.`,
    `- Brand colors (use these exactly): ${palette}. Use ${primary} as the main label background; use ${secondary} for the bottom band and accents; use the third color for body text / outlines.`,
    `- Typography: headings in ${g.typography.heading}, body in ${g.typography.body}. Wordmark is the strongest typographic moment.`,
    g.moodCaption ? `- Visual mood: ${g.moodCaption}.` : null,
    brandMessage ? `- Brand message to convey throughout the copy: "${brandMessage}".` : null,
    "",
    `OUTPUT REQUIREMENTS:`,
    `- Single 4:3 landscape canvas.`,
    `- Photorealistic print-quality look. All text crisp, legible, properly spelled.`,
    `- Clean white background outside the colored label area.`,
    `- No 3D mockup, no drop shadow under the label, no product photo composed on top, no extra captions/watermarks.`,
    revision?.note ? `Revision request: ${revision.note}.` : null,
    revision?.quickFix ? `Quick fix: ${revision.quickFix}.` : null,
  ];

  return lines.filter((l): l is string => l !== null).join("\n");
}

/**
 * Translates a UI-facing style preset into concrete scene direction the image
 * model can act on. `null` means "no preset chosen" — the prompt falls back to
 * letting the model infer scene from brand/market context.
 */
function presetSceneDirection(preset: StyleShotPreset | undefined): string | null {
  switch (preset) {
    case "usage_scene":
      return [
        "SCENE — usage moment:",
        "Show the product being held or used by a person mid-action. Only hands or partial body visible (avoid full faces / identifiable portraits).",
        "Natural, candid gesture that conveys actual use of the product (pouring, dabbing, opening, applying — match what makes sense for the product category).",
        "Soft, warm natural light, slightly off-axis. Background lightly defocused so the product + gesture remain the heroes.",
      ].join(" ");
    case "styling_props":
      return [
        "SCENE — editorial styling with props:",
        "Stage the product as the central hero. Surround it with a thoughtful, minimal arrangement of complementary props that make sense for the product category — fresh ingredients, florals, raw textiles (linen, silk), ceramic vessels, marble or wood surfaces.",
        "Magazine-editorial composition (Kinfolk / Cereal / Vogue still-life). Warm directional light, gentle shadows, considered negative space.",
      ].join(" ");
    case "lifestyle":
      return [
        "SCENE — lifestyle setting:",
        "Place the product naturally in a real lifestyle environment appropriate to its category (e.g. food → sunlit kitchen counter with cookware nearby; cosmetics → bathroom vanity with linen and ceramics; tech → minimalist desk; beverages → café table).",
        "Casual, lived-in feel. Soft natural daylight from a window. Slight depth-of-field separation. Feels like a candid moment, not a studio shoot.",
      ].join(" ");
    case "closeup_detail":
      return [
        "SCENE — macro detail:",
        "Tight macro / closeup framing. Emphasize the product's surface texture, label print quality, material finish, and cap or closure detail.",
        "Shallow depth of field — only a small portion of the product in razor-sharp focus, the rest dreamily blurred. Single-source studio lighting that sculpts texture and edges.",
      ].join(" ");
    case "minimal_studio":
      return [
        "SCENE — minimal studio:",
        "Single-color seamless studio backdrop in a brand-aligned tone. Product photographed clean and graphic; sculpted hard-then-soft shadows.",
        "High-contrast advertising aesthetic — Apple / Aesop / COS commercial style. No props. Let the product be the entire composition. Symmetrical or rule-of-thirds composition.",
      ].join(" ");
    case "ai_recommended":
    case undefined:
      return [
        "SCENE — AI-directed:",
        "Compose the scene to best amplify the brand's visual mood and the target market's aesthetic expectations. Choose between minimal studio, editorial styling-with-props, or a lifestyle setting based on which most strongly communicates the brand identity given the brand colors, mood, and message above.",
      ].join(" ");
  }
}

function buildStyleShotPrompt(
  input: GenerationInput,
  opts: { hasReference: boolean; hasBase: boolean },
): string {
  const { brandGuide: g, market, brandMessage, styleShot, revision } = input;
  const palette = g.palette
    .map((p) => `${p.hex}${p.name ? ` (${p.name})` : ""}`)
    .join(", ");
  const brand = g.brandName ?? g.logoWordmark?.text ?? "BRAND";
  const scene = presetSceneDirection(styleShot?.preset);
  const additional = (styleShot?.additionalRequest ?? "").trim();
  const lang = languageForMarket(market);

  // Image input layout. gpt-image-2/edit treats image (1) as the canvas/base
  // for editing, and additional images as references. So when revising from
  // a previously-generated variant, that variant becomes (1); when starting
  // fresh, the product becomes (1).
  //
  //   no base, no ref  → [PRODUCT]
  //   no base, ref     → [PRODUCT, REFERENCE]
  //   base, no ref     → [PREV_RESULT, PRODUCT]
  //   base, ref        → [PREV_RESULT, PRODUCT, REFERENCE]
  const productIdx = opts.hasBase ? 2 : 1;
  const refIdx = opts.hasReference ? (opts.hasBase ? 3 : 2) : 0;

  const lines: (string | null)[] = [
    `Generate a high-end product styling photograph (a "고감도 디자인 연출샷") — magazine-quality commercial / lifestyle still featuring the product.`,
    `NOT a label flat. NOT a 3D render. NOT a packshot on white. The output is a photographic scene that elevates the product as a brand object.`,
    "",
    `INPUT IMAGES (in order):`,
    opts.hasBase
      ? `  (1) PREVIOUS RESULT — the user is iterating on this image. Keep its overall composition, lighting direction, and mood as the starting point; apply the requested revision below as a focused edit, not a full re-imagining.`
      : null,
    `  (${productIdx}) ACTUAL PRODUCT — visual reference for the product's shape, colors, container, and label layout. Preserve container shape, label background colors, label layout/structure, and proportions exactly. The product LABEL TEXT may be re-rendered in the target market language when localization applies (see below); do NOT change anything else about the product's visual design.`,
    refIdx > 0
      ? `  (${refIdx}) STYLE REFERENCE — borrow LIGHTING, COLOR GRADING, COMPOSITION, AND MOOD from this image. Do NOT copy the reference's product or props verbatim — only its photographic treatment.`
      : null,
    "",
    `CRITICAL — product identity comes from the image, not from the brand guide:`,
    `- The product CATEGORY, SHAPE, FUNCTION, and IDENTITY are dictated EXCLUSIVELY by image (${productIdx}). What you see in that image IS the product. If image (${productIdx}) shows a model kit, depict a model kit. If it shows a bottle, depict that bottle. If it shows hardware, depict that hardware.`,
    `- The brand guide below informs the surrounding SCENE only — colors of props, surfaces, textiles, walls, mood, lighting. It does NOT dictate what the product is.`,
    `- If the brand guide's typical product category differs from what image (${productIdx}) actually shows (for example a beverage brand guide paired with a model-kit product image), depict the product from image (${productIdx}). NEVER substitute the brand's typical product for the one in the image, and never add a second product from the brand alongside it.`,
    "",
    `PRODUCT LABEL LOCALIZATION (${lang.label} / ${lang.code}):`,
    `- This block applies ONLY when the product in image (${productIdx}) is a labeled consumer-packaged item where label text is a meaningful part of the design (food, beverage, cosmetics, household goods, toiletries, supplements, etc.). For products where the visible text is minimal, decorative, brand-collab, or foreign-by-design — model kits, art objects, electronics with mostly model numbers, hardware, apparel, hobby items — SKIP localization entirely and preserve the label exactly as shown in image (${productIdx}).`,
    `- When localization applies: render label text in ${lang.label}, as if this were the regional retail SKU for ${market}.`,
    `- BRAND WORDMARK / logo: ALWAYS keep verbatim in its ORIGINAL script regardless of category (e.g. "Yondu" — food, "Hermès" — luxury, "Bandai" — model kits, "Sony" — electronics, "Aesop" — cosmetics). Do NOT translate or transliterate the wordmark itself. If the wordmark is non-Latin and the target market uses a Latin script, you may add a small Latin transliteration NEAR the wordmark in much smaller weight, but the original script must remain dominant.`,
    `- Translate any short descriptor or tagline near the wordmark (1-3 word phrases) into idiomatic ${lang.label}. The descriptor's nature depends on category — a flavor for food, a fragrance note for cosmetics, a finish for hardware, etc. — translate whatever actually applies to this product.`,
    `- Translate visible specification callouts that make sense for the product's category (volume for liquids, weight for solids, count, dimensions). MODEL NUMBERS, serial numbers, version codes, and regulatory marks are preserved verbatim.`,
    `- For dense small text appropriate to the category (ingredients/nutrition for food; usage and warnings for cosmetics; spec sheet for electronics; assembly notes for model kits), render plausible ${lang.label} typography that reads cleanly. Prioritize visual coherence and legibility over exact wording — better legible-and-plausible than garbled mojibake or mixed-script soup.`,
    `- DO NOT change: container shape, label background colors, label layout/structure, product silhouette, scale, cap or closure design.`,
    "",
    scene,
    "",
    `BRAND DIRECTION:`,
    `- Brand: ${brand}.`,
    `- Target market: ${market}. Aesthetic cues should feel native to this market without being clichéd or stereotyped.`,
    `- Brand colors (use as supporting palette via props, surfaces, textiles, walls — NOT applied to the product itself): ${palette}.`,
    g.moodCaption ? `- Visual mood to evoke: ${g.moodCaption}.` : null,
    brandMessage ? `- Brand message to evoke through the scene: "${brandMessage}".` : null,
    additional ? `- Additional creative direction from the user: ${additional}.` : null,
    "",
    `OUTPUT REQUIREMENTS:`,
    `- Single 1:1 square photograph at high resolution.`,
    `- Photorealistic, magazine-editorial quality. Sharp focus on the product, professional lighting and color grading.`,
    `- The product (image ${productIdx}) must be clearly identifiable and feature prominently as the visual hero, with its label localized to ${lang.label} as specified above.`,
    `- No watermarks, no overlay text, no captions, no logos that aren't already on the product itself.`,
    `- No surreal artifacts, no extra duplicates of the product, no impossible geometry. Treat as a real product photoshoot.`,
    revision?.note ? `Revision request: ${revision.note}.` : null,
    revision?.quickFix ? `Quick fix: ${revision.quickFix}.` : null,
  ];

  return lines.filter((l): l is string => l !== null).join("\n");
}

function buildShortVideoPrompt(
  input: GenerationInput,
  opts: {
    productInfo?: ProductInfo;
    concept?: ShortVideoConcept;
    additionalRequest?: string;
  } = {},
): string {
  const { brandGuide: g, market, brandMessage, revision } = input;
  const palette = g.palette
    .map((p) => `${p.hex}${p.name ? ` (${p.name})` : ""}`)
    .join(", ");
  const brand = g.brandName ?? g.logoWordmark?.text ?? "BRAND";
  const category = (opts.productInfo?.category ?? "").trim();
  // Concept is now mandatory at the UI layer. Fallback to cinematic_mood
  // covers any legacy callsite (e.g. revision of a project saved before this
  // change) — it's the most class-agnostic of the remaining concepts.
  const concept: ShortVideoConcept = opts.concept ?? "cinematic_mood";
  const conceptMeta = SHORT_VIDEO_CONCEPTS.find((c) => c.id === concept);
  const additional = (opts.additionalRequest ?? "").trim();

  const lines: (string | null)[] = [
    `9:16 vertical short-form clip starring the product. Preserve product identity, label, container, colors, proportions EXACTLY across every frame — never morph, replace, swap, or duplicate.`,
    `Concept: ${conceptMeta?.label ?? "시네마틱 무드"} — ${conceptMeta?.description ?? "minimal cinematic hero shot"}.`,
    category ? `Category hint: ${category}.` : null,
    `Silently identify class (food/beverage/cosmetic/cleaning/electronics/toy/apparel/stationery/tool/other); adapt scene to it. Never default to a kitchen for non-food.`,
    "",
    ...directionForConcept(concept),
    "",
    `Camera locked, mostly stable. Shallow DoF, product sharp, background creamy.`,
    `Brand: ${brand} · market ${market}. Palette (${palette}) applied as ambient tones, NEVER on the product itself.`,
    g.moodCaption ? `Mood: ${g.moodCaption}.` : null,
    brandMessage ? `Brand message: "${brandMessage}".` : null,
    additional ? `User direction: ${additional}.` : null,
    "",
    `Output: 9:16 vertical, 720p, 5s, premium product-advertising aesthetic. Product stays comfortably in frame.`,
    `No watermarks, no overlay text, no on-screen captions. No surreal artifacts, no extra duplicates, no morphing.`,
    revision?.note ? `Revision request: ${revision.note}.` : null,
    revision?.quickFix ? `Quick fix: ${revision.quickFix}.` : null,
  ];

  return lines.filter((l): l is string => l !== null).join("\n");
}

/**
 * STEP 2 block for the short-video prompt — varies per concept. Returns an
 * array of strings ready to splice into the prompt body.
 *
 * Each concept gives the model a different center of gravity: usage gesture,
 * finished result, micro-process, kinetic ingredient drop, or pure cinematic
 * atmosphere.
 */
function directionForConcept(concept: ShortVideoConcept): string[] {
  switch (concept) {
    case "usage_guide":
      return [
        `Usage demonstration: a pair of hands (only hands — NO faces, NO bodies) performs ONE realistic primary usage gesture for this product in 5 seconds. The target/setting must MATCH the product's class and feel like a real owner's moment of use — never blank, never empty, never food-themed for non-food, never non-food for food.`,
        `Class anchors: (A) drizzle/spoon onto a plated dish; (B) prepare/serve with cookware (cup-noodle pour, plate steaming food); (C) pour into garnished glass or load brewer (beans→grinder, drip→mug, capsule→machine, stick→hot water); (D) apply to wrist/skin with vanity props; (E) spray/wipe a visibly soiled surface; (F) use on a desk with monitor/keyboard/cables — never in a kitchen; (G) hold/pose on a play surface with class-appropriate context — never in a kitchen; (H) worn on hand/wrist or laid out on fabric/leather — never on food; (I) at a desk with paper/notebook/book — never in a kitchen; (J) used on its actual target object — never on a plate; (K) match what is literally in the starting frame.`,
        `Hands look natural and anatomical. The product remains the visual hero — hands serve it, never compete. If class is uncertain, do NOT default to a kitchen scene.`,
      ];
    case "recipe":
      return [
        `Finished result: show a fully-styled outcome that this product produced or enabled, with the product visible alongside the result. NO mid-process shots, NO raw ingredients on screen — the moment looks fully complete.`,
        `Class anchors: (A/B) plated finished dish with the product bottle/jar/pack beside it; (C) finished drink garnished (latte art / foam / ice / lemon) with the product alongside; (D) styled cosmetic result on hand/wrist (glowing skin, swatch, polished nail) with the product alongside; (E) visibly clean surface with the product alongside; (F) live desk scene — monitor aglow, cursor moving — with the product in place; (G) the finished assembled/built form of the toy; (H) apparel worn or styled on fabric/leather — never on food; (I) finished page/open book/styled workspace; (J) the tool's completed work beside the tool; (K) match what is literally in the starting frame.`,
        `Camera slowly pushes in or pulls back to reveal both product and result. Hands optional — only serving the reveal, never competing.`,
      ];
    case "cooking_process":
      return [
        `Process beat: a tight 2-beat micro-story in 5 seconds — Beat 1 setup/raw, Beat 2 product is added/applied/placed/triggered, implied result by the end. Smooth continuous camera links the beats — never a hard cut.`,
        `Class anchors: (A/B) raw dish → drizzle/spoon product → finished bite; (C) empty glass with ice → pour/load product → finished drink with foam/garnish; (D) bare skin → dab/pump product → glow; (E) soiled surface → spray/wipe → clean; (F) bare desk → place/plug/click product → desk lights up; (G) parts spread → key piece placed → assembled; (H) folded apparel → wear/open → styled outcome; (I) blank page → bring pen/book → first line written; (J) raw target → tool used → completed work; (K) follow the starting frame's setting.`,
        `Product is visible at the transition, anchoring both beats. Hands optional (only hands, no faces).`,
      ];
    case "kinetic_food":
      return [
        `STEP 2 — KINETIC FOOD PROMOTION (stop-motion-style ingredient dynamics around the product):`,
        `Create a high-energy commercial-style clip where ingredients explode, fall, splash, and orbit around the product in a stop-motion-feel burst — the classic premium food-advertising aesthetic that visualizes flavor power. Think soy sauce commercials, hot sauce ads, beverage launch reels: the product is rock-stable while a choreographed cloud of ingredients flies around it.`,
        `This concept is engineered for FOOD and BEVERAGE classes (A / B / C). If the product is non-food, gracefully degrade toward a cinematic hero shot with brand-palette particles or category-appropriate elements instead of literal ingredients — never invent food around a non-food product.`,
        "",
        `DIRECTION:`,
        `- The product is the steady visual anchor — sits centered or slightly off-center, ROCK STABLE in every frame. Everything else moves around it.`,
        `- A choreographed burst of ingredients caught mid-air around the product. Mix motions: some falling from above, some splashing, some orbiting, some bursting outward as if energy radiates from the product itself.`,
        `- Stop-motion / freeze-frame feel: ingredients look sharply frozen, with subtle motion blur trailing them. The overall composition has continuous flow — not a static collage.`,
        `- Camera holds steady or performs a very slow push-in toward the product. No pans, no shake.`,
        `- Lighting: high-key commercial advertising light with deliberate rim light + dramatic directional shadows. Color grade saturated and food-photography-rich.`,
        `- BACKGROUND must match the product's actual category — do NOT keep a blank/white packshot background, and do NOT default to a generic gradient. Pick a real, brand-aligned environment from frame 1:`,
        `    · sauces / oils / pastes / seasonings → a warm kitchen counter (wood or marble surface, fresh herbs and ingredients staged nearby, soft window light, hint of kitchenware in soft focus behind).`,
        `    · ready-to-cook / snack / instant food → a kitchen counter or dining surface with serving cookware cues (steaming pot, plated portion, chopsticks).`,
        `    · beverages / coffee / tea / RTD → a cafe table, bar top, or dining surface with garnish-relevant props (ice, citrus, glassware, foam, brewing setup) and a sunlit window in soft focus.`,
        `    · for non-food fallback → match the product's natural use context (vanity / desk / studio surface).`,
        `Background stays in shallow depth of field so it never competes with the product, but it must read as a real place where this product naturally lives.`,
        `- NO hands, NO faces. Pure product hero with ingredient choreography around it.`,
        "",
        `THE INGREDIENTS MUST MATCH WHAT THE PRODUCT ACTUALLY IS (read it from the starting frame + category hint):`,
        `    · soy sauce / fish sauce → flying garlic cloves, sliced ginger, dried red pepper, splashes of dark sauce arcing through air, sesame seeds.`,
        `    · sesame oil → sesame seeds streaming, golden oil drops, herb leaves.`,
        `    · gochujang / hot sauce → flying red chili peppers, splashed red sauce arcs, garlic, sesame.`,
        `    · ssamjang / doenjang → soybeans, garlic cloves, splashes of paste, green onion.`,
        `    · cooking oil → herb leaves, garlic, dried spice, droplets.`,
        `    · coffee → coffee beans flying, milk splash arcs, cocoa or cinnamon dust, steam.`,
        `    · tea → tea leaves, water droplets, citrus slices, fresh herbs.`,
        `    · seasoning powder / spice → corresponding herb/spice + the dish ingredients it would land on, mid-flight.`,
        `    · snack / instant food → the literal ingredients of that snack (chips → potato slices + salt; ramyeon → noodles + green onion + chili; cookies → flour dust + chocolate chunks).`,
        `    · RTD beverage / juice → corresponding fruits, ice cubes, splashes of the drink itself.`,
        `    · beer → wheat stalks, hops, foam splash, water droplets.`,
        `    · wine / spirits → grapes, cork, dark splash arcs.`,
        `If the exact category isn't clear, pick the 2-3 most stereotype-defining ingredients for the closest class and commit to those — don't mix unrelated ingredients.`,
        "",
        `HARD RULES:`,
        `- The product remains photo-realistically static and identifiable. The label MUST NEVER morph, transform, or be obscured by ingredients.`,
        `- Ingredients NEVER cross over or block the product label.`,
        `- No flying brand logos, no extra duplicates of the product, no flying packaging.`,
        `- Motion blur on ingredients is welcome; the product itself stays tack-sharp.`,
      ];
    case "cinematic_mood":
      return [
        `Cinematic hero shot — pure product film (Aesop / Apple / Hermès style). NO humans, NO hands, NO faces, NO bodies. Movement comes ONLY from the camera and atmospheric elements.`,
        `Camera: pick ONE — slow push-in, soft 30° orbit, or quiet vertical parallax. Gentle and continuous, never abrupt.`,
        `Atmosphere: drifting sun rays, soft bokeh, gentle particle drift, faint steam or refractive light catches — match the product's material. Single-source cinematic light grade. Setting: a styled minimal surface (wood / marble / linen / paper) aligned with the product's aesthetic. Negative space welcome.`,
      ];
  }
}

class FalProvider implements AIProvider {
  async extractBrandGuide(
    input: BrandExtractionInput,
  ): Promise<BrandExtractionResult> {
    if (!FAL_KEY || !input.imageDataUrl || !isVisionMime(input.mimeType)) {
      return mockProvider.extractBrandGuide(input);
    }

    try {
      const imageUrl = await uploadDataUrl(
        input.imageDataUrl,
        input.fileName || "brand.png",
      );
      const result = await fal.subscribe(
        "nvidia/nemotron-3-nano-omni/vision",
        {
          input: {
            prompt: BRAND_ANALYSIS_PROMPT,
            image_url: imageUrl,
            system_prompt: BRAND_ANALYSIS_SYSTEM,
            reasoning_mode: "no_think",
            max_tokens: 1024,
            temperature: 0.2,
          },
        },
      );
      const text =
        (result.data as { output?: string } | undefined)?.output ?? "";
      const parsed = parseBrandJson(text);
      if (!parsed) {
        // Couldn't extract a valid JSON shape — fall back so the user isn't blocked.
        return mockProvider.extractBrandGuide(input);
      }
      return {
        brandGuide: {
          logo: "", // wordmark is rendered instead
          logoWordmark: parsed.logoWordmark,
          palette: parsed.palette,
          typography: parsed.typography,
          moodboard: [],
          brandName: parsed.brandName,
          moodCaption: parsed.moodCaption,
        },
        confidence: parsed.confidence,
      };
    } catch (e) {
      // Vision LLM hiccup → graceful fallback.
      console.error("[fal] extractBrandGuide failed:", e);
      return mockProvider.extractBrandGuide(input);
    }
  }

  async startGeneration(
    kind: JobKind,
    input: GenerationInput,
  ): Promise<{
    jobId: string;
    uploads?: { product?: string; reference?: string };
  }> {
    if (!FAL_KEY) return mockProvider.startGeneration(kind, input);

    if (kind === "package") {
      return this.startPackage(input);
    }
    if (kind === "style_shot") {
      return this.startStyleShot(input);
    }
    if (kind === "short_video") {
      return this.startShortVideo(input);
    }
    return mockProvider.startGeneration(kind, input);
  }

  async getJob(jobId: string): Promise<Job | null> {
    const parsed = parseJobId(jobId);
    if (!parsed) return mockProvider.getJob(jobId);
    if (!FAL_KEY) {
      throw new AIError("GENERATION_FAILED", "FAL_KEY missing on server");
    }

    const model = jobModel.get(jobId) ?? modelForKind(parsed.kind);
    const startedAt = parsed.startedAt;

    try {
      const status = await fal.queue.status(model, {
        requestId: parsed.requestId,
      });

      if (status.status === "IN_QUEUE") {
        return {
          id: jobId,
          kind: parsed.kind,
          status: "queued",
          progress: 0,
          startedAt,
        };
      }
      if (status.status === "IN_PROGRESS") {
        const elapsed = Date.now() - startedAt;
        const progress = Math.min(
          PROGRESS_CAP,
          elapsed / ESTIMATED_DURATIONS_MS[parsed.kind],
        );
        return {
          id: jobId,
          kind: parsed.kind,
          status: "running",
          progress,
          startedAt,
        };
      }
      if (status.status === "COMPLETED") {
        const result = await fal.queue.result(model, {
          requestId: parsed.requestId,
        });
        const variants = parseVariants(parsed.kind, result.data, {
          concept: parsed.concept,
        });
        return {
          id: jobId,
          kind: parsed.kind,
          status: "succeeded",
          progress: 1,
          result: { variants },
          startedAt,
        };
      }
      // Unknown status — treat as still running.
      return {
        id: jobId,
        kind: parsed.kind,
        status: "running",
        progress: 0,
        startedAt,
      };
    } catch (e) {
      const message = e instanceof Error ? e.message : "fal.queue.status failed";
      return {
        id: jobId,
        kind: parsed.kind,
        status: "failed",
        progress: 0,
        error: message,
        startedAt,
      };
    }
  }

  private async startStyleShot(
    input: GenerationInput,
  ): Promise<{
    jobId: string;
    uploads?: { product?: string; reference?: string };
  }> {
    // Resolve product image: prefer cached CDN URL, fall back to dataURL upload.
    let productUrl: string;
    if (input.productImageRemoteUrl?.startsWith("https://")) {
      productUrl = input.productImageRemoteUrl;
    } else if (input.productImageDataUrl) {
      productUrl = await uploadDataUrl(
        input.productImageDataUrl,
        "product.png",
      );
    } else {
      throw new AIError(
        "INVALID_INPUT",
        "제품 이미지가 비어있습니다. 페이지를 새로고침하셨다면 대시보드에서 다시 업로드해주세요.",
      );
    }

    // Resolve reference image (optional, used as photographic-style guide).
    let referenceUrl: string | null = null;
    if (input.referenceImageRemoteUrl?.startsWith("https://")) {
      referenceUrl = input.referenceImageRemoteUrl;
    } else if (input.referenceImageDataUrl) {
      referenceUrl = await uploadDataUrl(
        input.referenceImageDataUrl,
        "reference.png",
      );
    }

    // Revision base — when the user picked a specific variant to iterate on,
    // we feed it as image (1) so gpt-image-2/edit treats it as the canvas to
    // modify rather than starting from scratch. Initial generation has no
    // base; product is image (1).
    const baseVariantUrl =
      input.revision?.baseVariantUrl &&
      input.revision.baseVariantUrl.startsWith("https://")
        ? input.revision.baseVariantUrl
        : null;

    // No describeProduct here — the multimodal model already sees the product
    // image directly, and style-shot prompts don't need a textual category
    // anchor the way label artwork does. Skipping saves ~10s of pre-flight
    // latency.
    const prompt = buildStyleShotPrompt(input, {
      hasReference: !!referenceUrl,
      hasBase: !!baseVariantUrl,
    });
    const model = modelForKind("style_shot");

    const imageUrls: string[] = [];
    if (baseVariantUrl) imageUrls.push(baseVariantUrl);
    imageUrls.push(productUrl);
    if (referenceUrl) imageUrls.push(referenceUrl);

    const submitted = await fal.queue.submit(model, {
      input: {
        prompt,
        image_urls: imageUrls,
        // 1:1 reads well in the 2-up grid the UI uses for style shots and is
        // the safe default for social marketing assets. Per-aspect-ratio
        // selection can come later.
        image_size: "square_hd",
        // medium is plenty for marketing photography; high doubles latency for
        // detail we don't need (no dense label text to render).
        quality: "medium",
        // Two samples in one submit — gpt-image-2 randomizes the seed per
        // sample so the user gets variety to pick from. parseVariants already
        // maps each image to "스타일 1 / 스타일 2" labels.
        num_images: 2,
        output_format: "png",
      },
    });

    const requestId = submitted.request_id;
    const startedAt = Date.now();
    const jobId = makeJobId("style_shot", startedAt, requestId);
    jobModel.set(jobId, model);
    return {
      jobId,
      uploads: {
        product: productUrl,
        reference: referenceUrl ?? undefined,
      },
    };
  }

  private async startShortVideo(
    input: GenerationInput,
  ): Promise<{
    jobId: string;
    uploads?: { product?: string; reference?: string };
  }> {
    // Resolve product image — same pattern as startStyleShot. The product still
    // is the seedance starting frame; everything else is generated motion.
    let productUrl: string;
    if (input.productImageRemoteUrl?.startsWith("https://")) {
      productUrl = input.productImageRemoteUrl;
    } else if (input.productImageDataUrl) {
      productUrl = await uploadDataUrl(
        input.productImageDataUrl,
        "product.png",
      );
    } else {
      throw new AIError(
        "INVALID_INPUT",
        "제품 이미지가 비어있습니다. 페이지를 새로고침하셨다면 대시보드에서 다시 업로드해주세요.",
      );
    }

    // Best-effort product classification — gives the motion-direction prompt
    // an explicit category anchor (so "cap turning open" is dropped for, say, a
    // model kit, and the model picks a sensible gesture instead). Failure is
    // non-fatal: describeProduct returns empty strings on error.
    const productInfo = await describeProduct(productUrl);
    console.log(
      "[fal] short_video productInfo:",
      productInfo.hint ? productInfo.hint : "(empty)",
    );

    // Normalize incoming concept against the current preset list. Persisted
    // projects from earlier dev sessions may carry a deprecated id (e.g.
    // "ai_recommended" or "brand_story" which we've since removed). Map
    // anything unknown to "cinematic_mood" — the safest class-agnostic
    // concept — so the prompt and meta-label paths can't crash.
    const requestedConcept = input.shortVideo?.concept;
    const concept: ShortVideoConcept =
      requestedConcept &&
      SHORT_VIDEO_CONCEPTS.some((c) => c.id === requestedConcept)
        ? requestedConcept
        : "cinematic_mood";
    const additionalRequest = input.shortVideo?.additionalRequest;
    const prompt = buildShortVideoPrompt(input, {
      productInfo,
      concept,
      additionalRequest,
    });
    const model = modelForKind("short_video");

    const submitted = await fal.queue.submit(model, {
      input: {
        prompt,
        image_url: productUrl,
        // Shortform vertical: TikTok / Reels / Shorts.
        aspect_ratio: "9:16",
        // 5s — fast feedback loop. Bump to 10s later when we want hero clips.
        duration: "5",
        resolution: "720p",
        // Default is true; muting saves Seedance's audio-gen pass and keeps
        // the clip silent for SNS overlay work.
        generate_audio: false,
      },
    });

    const requestId = submitted.request_id;
    const startedAt = Date.now();
    const jobId = makeJobId("short_video", startedAt, requestId, concept);
    jobModel.set(jobId, model);
    return {
      jobId,
      uploads: { product: productUrl },
    };
  }

  private async startPackage(
    input: GenerationInput,
  ): Promise<{
    jobId: string;
    uploads?: { product?: string; reference?: string };
  }> {
    // Resolve product image: prefer cached CDN URL, fall back to dataURL upload.
    let productUrl: string;
    if (input.productImageRemoteUrl?.startsWith("https://")) {
      productUrl = input.productImageRemoteUrl;
    } else if (input.productImageDataUrl) {
      productUrl = await uploadDataUrl(
        input.productImageDataUrl,
        "product.png",
      );
    } else {
      throw new AIError(
        "INVALID_INPUT",
        "제품 이미지가 비어있습니다. 페이지를 새로고침하셨다면 대시보드에서 다시 업로드해주세요.",
      );
    }

    // Resolve reference image (optional).
    let referenceUrl: string | null = null;
    if (input.referenceImageRemoteUrl?.startsWith("https://")) {
      referenceUrl = input.referenceImageRemoteUrl;
    } else if (input.referenceImageDataUrl) {
      referenceUrl = await uploadDataUrl(
        input.referenceImageDataUrl,
        "reference.png",
      );
    }
    // Pre-classify the product so the prompt has explicit textual context.
    // Without this, gpt-image-2 with two reference images often collapses
    // category onto whichever image is visually louder (usually the style
    // reference). Treated downstream as a low-confidence hint — image (1)
    // remains the source of truth.
    const productInfo = await describeProduct(productUrl);
    console.log(
      "[fal] productInfo:",
      productInfo.hint ? productInfo.hint : "(empty)",
    );
    const prompt = buildLabelPrompt(input, {
      hasReference: !!referenceUrl,
      productInfo,
    });
    const model = modelForKind("package");

    const submitted = await fal.queue.submit(model, {
      input: {
        prompt,
        image_urls: referenceUrl ? [productUrl, referenceUrl] : [productUrl],
        // Label spread is wider than tall — match Yondu-style die-line proportions.
        image_size: "landscape_4_3",
        quality: "high",
        num_images: 1,
        output_format: "png",
      },
    });

    const requestId = submitted.request_id;
    const startedAt = Date.now();
    const jobId = makeJobId("package", startedAt, requestId);
    jobModel.set(jobId, model);
    return {
      jobId,
      uploads: {
        product: productUrl,
        reference: referenceUrl ?? undefined,
      },
    };
  }
}

function modelForKind(kind: JobKind): string {
  switch (kind) {
    case "package":
      return "openai/gpt-image-2/edit";
    case "style_shot":
      return "openai/gpt-image-2/edit";
    case "short_video":
      return "bytedance/seedance-2.0/image-to-video";
  }
}

type FalImage = { url: string; width?: number; height?: number };
type FalVideo = { url: string };

function parseVariants(
  kind: JobKind,
  data: unknown,
  extras: { concept?: ShortVideoConcept } = {},
): JobVariant[] {
  const d = (data ?? {}) as { images?: FalImage[]; video?: FalVideo };

  if (kind === "package") {
    const images = d.images ?? [];
    return images.map((img, i) => ({
      id: `pkg-${i}`,
      url: img.url,
      label: i === 0 ? "라벨 v1" : `라벨 v${i + 1}`,
      description: "fal · gpt-image-2",
    }));
  }
  if (kind === "style_shot") {
    const images = d.images ?? [];
    return images.map((img, i) => ({
      id: `style-${i}`,
      url: img.url,
      label: `스타일 ${i + 1}`,
    }));
  }
  if (kind === "short_video") {
    const url = d.video?.url;
    if (!url) return [];
    // Resolve the user-facing concept label from the active preset. Falls back
    // to the cinematic_mood label for any legacy jobId whose concept slot is
    // missing or no longer recognized (e.g. deprecated "ai_recommended").
    const conceptId = extras.concept ?? "cinematic_mood";
    const conceptLabel =
      SHORT_VIDEO_CONCEPTS.find((c) => c.id === conceptId)?.label ??
      "숏폼 영상";
    return [
      {
        id: "video-1",
        url,
        label: "숏폼 영상",
        meta: {
          concept: conceptLabel,
          ratio: "9:16",
          duration: "5초",
          resolution: "720p",
        },
      },
    ];
  }
  return [];
}

/* -------------------------------------------------------------------------- */
/* Product classification (used to anchor label generation)                   */
/* -------------------------------------------------------------------------- */

export type ProductInfo = {
  /** Visual observation — color, texture, container, visible text. */
  visual: string;
  /**
   * Verbatim product wordmark / name as it literally appears on the source
   * package (e.g. "Yondu", "샘표 양조간장", "Coca-Cola"). Empty when no clear
   * wordmark could be read.
   */
  productName: string;
  /** Best-guess product category in English (e.g. "vegetable umami seasoning"). */
  category: string;
  /** Combined hint string for embedding back into the label-generation prompt. */
  hint: string;
};

/**
 * Run nemotron vision on the product image to extract a perceptually-grounded
 * description of what the product actually is. Pulls THREE distinct fields:
 *   1) visual observation
 *   2) the verbatim wordmark/product name visible on the package
 *   3) the best-guess product category
 *
 * (2) is the important one for label generation — without it, the downstream
 * model collapses to translating the descriptor (e.g. "vegetable umami" →
 * "野菜のうま味") instead of using the actual product wordmark ("Yondu") as
 * the visual hero.
 *
 * Prompt deliberately avoids product-name examples to prevent a small model
 * from pattern-matching the example over the actual image.
 */
async function describeProduct(productUrl: string): Promise<ProductInfo> {
  const empty: ProductInfo = {
    visual: "",
    productName: "",
    category: "",
    hint: "",
  };
  try {
    const result = await fal.subscribe("nvidia/nemotron-3-nano-omni/vision", {
      input: {
        prompt: [
          "You are looking at a single product photograph.",
          "Output exactly THREE lines, nothing else (no preamble, no markdown, no bullets, no labels like 'LINE 1:'):",
          "",
          "Line 1 — Visual observation (one sentence, ~25 words). Describe ONLY what you literally see in the image: dominant color of the contents/label, texture (smooth / chunky / glossy / matte), container shape and material, approximate size if visible (e.g. 500g, 330ml), and ANY readable text or characters on the existing packaging (Korean, Japanese, English, numbers, etc.). Quote visible text verbatim where possible.",
          "",
          "Line 2 — Product wordmark / name as it literally appears on the package. Output the SINGLE most prominent product or brand name visible on the label, verbatim and in its original script (e.g. \"Yondu\", \"샘표 양조간장\", \"고추장\", \"Coca-Cola\", \"Hermès\"). Do NOT translate it. Do NOT describe it. If no clear wordmark is readable, output the literal text \"(no wordmark)\".",
          "",
          "Line 3 — Best-guess product category in English (one sentence, ~15 words). Based STRICTLY on the visual observation in line 1, name the most likely consumer product category. Mention cultural origin only if line 1 contains evidence. If unsure, say \"unidentified consumer product\" rather than guessing.",
          "",
          "Be careful with red vs brown vs yellow pastes — they are different products. Trust the colors you see, not what is typical.",
        ].join("\n"),
        image_url: productUrl,
        reasoning_mode: "think",
        max_tokens: 500,
        temperature: 0.1,
      },
    });
    const text =
      (result.data as { output?: string } | undefined)?.output ?? "";
    const lines = text
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const visual = (lines[0] ?? "").slice(0, 280);
    const rawWordmark = (lines[1] ?? "").trim();
    const productName = /^\(?\s*no\s*wordmark\s*\)?\s*$/i.test(rawWordmark)
      ? ""
      : rawWordmark.replace(/^["'`]+|["'`]+$/g, "").slice(0, 80);
    const category = (lines[2] ?? "").slice(0, 200);

    const hintParts: string[] = [];
    if (visual) hintParts.push(visual);
    if (productName) hintParts.push(`Wordmark on package: "${productName}"`);
    if (category) hintParts.push(category);
    const hint = hintParts.join(" • ").slice(0, 600);

    return { visual, productName, category, hint };
  } catch (e) {
    console.error("[fal] describeProduct failed:", e);
    return empty;
  }
}

/* -------------------------------------------------------------------------- */
/* Brand-guide vision analysis                                                */
/* -------------------------------------------------------------------------- */

function isVisionMime(mime: string): boolean {
  return mime === "image/png" || mime === "image/jpeg" || mime === "image/jpg";
}

/**
 * Cheap script check — true when the string is mostly Latin letters /
 * punctuation / digits. Used to decide whether a transliteration hint is
 * worth adding to the label prompt for non-Latin target markets.
 */
function isLatinScript(s: string): boolean {
  // Pull out only letter-ish chars (basic Latin + Latin-1 supplement +
  // Latin Extended-A/B). Anything that looks Korean / Japanese / Chinese /
  // Arabic / Cyrillic falls outside this range and pulls the result false.
  const letters = s
    .split("")
    .filter((ch) => /[A-Za-zÀ-ɏ]/.test(ch));
  if (letters.length === 0) return false;
  // 80% threshold so "Yondu®" or "Hermès" still count.
  const totalNonSpace = s.replace(/\s+/g, "").length;
  return totalNonSpace > 0 && letters.length / totalNonSpace >= 0.6;
}

/**
 * Map a Korean-language market label (as picked in the dashboard form) to
 * the explicit output language we want the model to write copy in.
 * Substring match so future market additions don't require an exact key.
 */
function languageForMarket(market: string): { label: string; code: string } {
  const m = market || "";
  // Order matters: more specific labels first.
  if (/스위스.*독일|swiss.*german/i.test(m)) {
    return { label: "Swiss German", code: "de-CH" };
  }
  if (/스위스.*프랑스|swiss.*french/i.test(m)) {
    return { label: "French", code: "fr-CH" };
  }
  if (/독일|germany|german/i.test(m)) {
    return { label: "German", code: "de-DE" };
  }
  if (/프랑스|france|french/i.test(m)) {
    return { label: "French", code: "fr-FR" };
  }
  if (/일본|japan|japanese/i.test(m)) {
    return { label: "Japanese", code: "ja-JP" };
  }
  if (/미국|usa|us|united states|english/i.test(m)) {
    return { label: "English", code: "en-US" };
  }
  if (/한국|korea|korean/i.test(m)) {
    return { label: "Korean", code: "ko-KR" };
  }
  if (/중국|china|chinese/i.test(m)) {
    return { label: "Simplified Chinese", code: "zh-CN" };
  }
  if (/스페인|spain|spanish/i.test(m)) {
    return { label: "Spanish", code: "es-ES" };
  }
  if (/이탈리아|italy|italian/i.test(m)) {
    return { label: "Italian", code: "it-IT" };
  }
  // Fallback: English. Better than letting the model guess from a Korean string.
  return { label: "English", code: "en-US" };
}

const BRAND_ANALYSIS_SYSTEM =
  "You are a brand identity analyst. You inspect brand guide artwork and emit a strict JSON description of the brand's visual identity. You never include prose, markdown, or code fences in your response — JSON only.";

const FONT_ALLOWLIST_FOR_PROMPT = BRAND_FONT_ALLOWLIST.join(", ");

const BRAND_ANALYSIS_PROMPT = `Analyze this brand guide image and extract the brand identity. Respond with STRICT JSON only — no markdown, no code fences, no commentary.

Required JSON shape:
{
  "brandName": string,
  "logoWordmark": {
    "text": string,
    "family": string,
    "color": string,
    "weight": 400|500|600|700|800,
    "italic": boolean,
    "tracking": number
  },
  "palette": [
    { "hex": string, "name": string }
  ],
  "typography": { "heading": string, "body": string },
  "moodCaption": string,
  "confidence": {
    "logo": number,
    "palette": number,
    "typography": number,
    "mood": number
  }
}

Rules:
- "palette" must contain EXACTLY 3 colors, ordered most → least dominant.
- All hex values uppercase #RRGGBB (7 chars including #).
- "moodCaption" ≤ 24 characters, uppercase, an evocative phrase capturing the brand's mood (e.g. "FRESH ESSENCE", "ARTISAN HERITAGE", "DIGITAL CLARITY").
- "weight" is the closest match from the listed values.
- "tracking" is in em units, typically between -0.04 and 0.06.
- All "confidence" values are floats in [0, 1].

FONT RULES (very important):
- "logoWordmark.family", "typography.heading", and "typography.body" MUST each be picked from this allowlist of Google Fonts. Pick the closest visual match — do NOT invent or use any other font:
  ${FONT_ALLOWLIST_FOR_PROMPT}
- Output the bare family name only (e.g. "Playfair Display", "Bebas Neue") — no fallbacks, no quotes, no "sans-serif" suffix.
- "typography.heading" and "typography.body" MUST be the SAME value (this brand uses one typeface for the whole system, just different weights). The wordmark family may differ if the logo is custom-set.
- Examples of good matches:
  · CHANEL / Vogue / Tiffany style logos → "Bodoni Moda" or "Italiana"
  · Sempio / heritage food brands → "Playfair Display" or "Lora"
  · tech / SaaS brands → "Inter" or "Manrope"
  · friendly D2C brands → "Plus Jakarta Sans" or "DM Sans"
  · script / hand-lettered logos → "Pacifico", "Caveat", "Sacramento"
  · all-caps poster → "Bebas Neue", "Anton", "Oswald"

Output JSON only.`;

type ParsedBrand = {
  brandName: string;
  logoWordmark: {
    text: string;
    family: string;
    color: string;
    weight: 400 | 500 | 600 | 700 | 800;
    italic: boolean;
    tracking: number;
  };
  palette: { hex: string; name?: string }[];
  typography: { heading: string; body: string };
  moodCaption: string;
  confidence: { logo: number; palette: number; typography: number; mood: number };
};

function parseBrandJson(raw: string): ParsedBrand | null {
  // Strip code fences / leading prose. Take from first '{' to last '}'.
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw.slice(start, end + 1));
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== "object") return null;
  const o = parsed as Record<string, unknown>;

  const wm = o.logoWordmark as Record<string, unknown> | undefined;
  const palette = Array.isArray(o.palette)
    ? (o.palette as Array<Record<string, unknown>>)
        .filter((p) => typeof p?.hex === "string" && /^#[0-9a-fA-F]{6}$/.test(p.hex as string))
        .map((p) => ({
          hex: (p.hex as string).toUpperCase(),
          name: typeof p.name === "string" ? (p.name as string) : undefined,
        }))
    : [];
  const typo = o.typography as Record<string, unknown> | undefined;
  const conf = o.confidence as Record<string, unknown> | undefined;

  if (palette.length < 2) return null;
  if (!wm || typeof wm.text !== "string") return null;
  if (!typo || typeof typo.heading !== "string" || typeof typo.body !== "string") {
    return null;
  }

  const weightCandidate = Number(wm.weight);
  const weight = ([400, 500, 600, 700, 800] as const).includes(
    weightCandidate as 400 | 500 | 600 | 700 | 800,
  )
    ? (weightCandidate as 400 | 500 | 600 | 700 | 800)
    : 700;

  return {
    brandName:
      typeof o.brandName === "string" && o.brandName.length > 0
        ? (o.brandName as string)
        : (wm.text as string),
    logoWordmark: {
      text: wm.text as string,
      family: typeof wm.family === "string" ? (wm.family as string) : "Inter",
      color:
        typeof wm.color === "string" && /^#[0-9a-fA-F]{6}$/.test(wm.color as string)
          ? (wm.color as string).toUpperCase()
          : palette[0].hex,
      weight,
      italic: Boolean(wm.italic),
      tracking: typeof wm.tracking === "number" ? (wm.tracking as number) : -0.02,
    },
    palette: palette.slice(0, 3),
    typography: {
      heading: typo.heading as string,
      // Single-typeface system: collapse body onto heading regardless of what
      // the model returned, so the brand panel renders consistently.
      body: typo.heading as string,
    },
    moodCaption:
      typeof o.moodCaption === "string" && (o.moodCaption as string).length > 0
        ? (o.moodCaption as string).toUpperCase().slice(0, 24)
        : "BRAND MOOD",
    confidence: {
      logo: numClamp(conf?.logo, 0.7),
      palette: numClamp(conf?.palette, 0.7),
      typography: numClamp(conf?.typography, 0.6),
      mood: numClamp(conf?.mood, 0.6),
    },
  };
}

function numClamp(v: unknown, fallback: number): number {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, Math.min(1, n));
}

export const falProvider: AIProvider = new FalProvider();
