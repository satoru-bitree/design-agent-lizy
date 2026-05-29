// Client-side dominant-color extraction for the brand palette section. The
// palette image upload is a *seed*: we pull the dominant colors out of the
// reference image, prefill the text input with their hex codes, and let the
// user review/edit before pressing 적용. No server call, no token spend.
//
// Pairs with parseHexList below — when the palette draft is pure hex, the store
// applies it verbatim (bypassing the LLM) so extracted colors aren't reinterpreted.

const SAMPLE_MAX_DIM = 96;
/** Quantize each channel to 4 bits (16 levels) when bucketing → ≤4096 buckets. */
const QUANT_SHIFT = 4;
/** Manhattan-distance floor between picked swatches, to drop near-duplicates. */
const MIN_SWATCH_DISTANCE = 48;
/** Pixels with alpha below this are treated as transparent and skipped. */
const MIN_ALPHA = 125;

export async function extractDominantColors(
  dataUrl: string,
  count = 5,
): Promise<string[]> {
  const img = await loadImage(dataUrl);
  const longer = Math.max(img.naturalWidth, img.naturalHeight) || 1;
  const scale = Math.min(1, SAMPLE_MAX_DIM / longer);
  const w = Math.max(1, Math.round(img.naturalWidth * scale));
  const h = Math.max(1, Math.round(img.naturalHeight * scale));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas 2d context unavailable");
  ctx.drawImage(img, 0, 0, w, h);
  const { data } = ctx.getImageData(0, 0, w, h);

  // Bucket by quantized color; keep a running channel sum so each bucket's
  // representative is the average of its members (truer than the bucket center).
  type Bucket = { r: number; g: number; b: number; n: number };
  const buckets = new Map<number, Bucket>();
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < MIN_ALPHA) continue;
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const key =
      ((r >> QUANT_SHIFT) << 8) |
      ((g >> QUANT_SHIFT) << 4) |
      (b >> QUANT_SHIFT);
    const bucket = buckets.get(key);
    if (bucket) {
      bucket.r += r;
      bucket.g += g;
      bucket.b += b;
      bucket.n += 1;
    } else {
      buckets.set(key, { r, g, b, n: 1 });
    }
  }

  const sorted = Array.from(buckets.values())
    .map((bk) => ({
      r: Math.round(bk.r / bk.n),
      g: Math.round(bk.g / bk.n),
      b: Math.round(bk.b / bk.n),
      n: bk.n,
    }))
    .sort((a, b) => b.n - a.n);

  const picked: { r: number; g: number; b: number }[] = [];
  for (const c of sorted) {
    if (picked.length >= count) break;
    const tooClose = picked.some(
      (p) =>
        Math.abs(p.r - c.r) + Math.abs(p.g - c.g) + Math.abs(p.b - c.b) <
        MIN_SWATCH_DISTANCE,
    );
    if (!tooClose) picked.push({ r: c.r, g: c.g, b: c.b });
  }
  // If min-distance filtering pruned everything (e.g. a near-solid image), keep
  // the single most common color so the user still gets a seed.
  if (picked.length === 0 && sorted.length > 0) {
    picked.push(sorted[0]);
  }

  return picked.map((c) => rgbToHex(c.r, c.g, c.b));
}

/**
 * Parse a palette draft made entirely of hex codes into the guide's palette
 * shape. Returns null if any token isn't a hex color — the caller then treats
 * the draft as a natural-language description and routes it through the LLM.
 * Accepts 3- or 6-digit hex, with or without a leading "#", comma/space separated.
 */
export function parseHexList(text: string): { hex: string }[] | null {
  const tokens = text
    .split(/[\s,]+/)
    .map((t) => t.trim())
    .filter(Boolean);
  if (tokens.length === 0) return null;

  const out: { hex: string }[] = [];
  for (const token of tokens) {
    const match = /^#?([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/.exec(token);
    if (!match) return null;
    let hex = match[1];
    if (hex.length === 3) {
      hex = hex
        .split("")
        .map((c) => c + c)
        .join("");
    }
    out.push({ hex: `#${hex.toUpperCase()}` });
  }
  return out;
}

/* -------------------------------------------------------------------------- */

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("이미지를 불러올 수 없습니다."));
    img.src = src;
  });
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (v: number) => v.toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}
