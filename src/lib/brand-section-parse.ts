import { BRAND_FONT_ALLOWLIST } from "@/lib/font-loader";
import type { BrandGuide } from "@/lib/mock-data";

export type Palette = BrandGuide["palette"];
export type Typography = BrandGuide["typography"];

const HEX_RE = /#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})/g;

const NAMED_COLORS: Record<string, string> = {
  red: "#E63946",
  green: "#3FA66E",
  blue: "#3B82F6",
  black: "#0A0A0A",
  white: "#FFFFFF",
  gray: "#737373",
  grey: "#737373",
  yellow: "#F4D35E",
  orange: "#F18F01",
  pink: "#F4B5C0",
  purple: "#8B5CF6",
  brown: "#8B5A3C",
  cyan: "#22D3EE",
  navy: "#1D3557",
  cream: "#F4F1DE",
  mint: "#5DBE8D",
};

/**
 * Parse free-form palette text into a structured palette.
 * Accepts: `#RRGGBB`, `#RGB`, `name#hex` ("Heritage Red #E63946"), or bare names
 * mapped through NAMED_COLORS. Anything unrecognized is skipped.
 */
export function parsePaletteText(text: string): Palette {
  const out: Palette = [];
  const seen = new Set<string>();

  // Each segment is one swatch. Split on commas/newlines so a label like
  // "Heritage Red" can hold the space.
  const segments = text
    .split(/[,\n]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  for (const seg of segments) {
    const hexMatch = seg.match(HEX_RE);
    let hex: string | null = null;
    let name: string | undefined;

    if (hexMatch && hexMatch[0]) {
      hex = expandHex(hexMatch[0]).toUpperCase();
      const label = seg.replace(HEX_RE, "").trim().replace(/[:\-–—]+$/, "").trim();
      if (label) name = label;
    } else {
      const lc = seg.toLowerCase();
      const mapped = NAMED_COLORS[lc];
      if (mapped) {
        hex = mapped.toUpperCase();
        name = seg;
      }
    }

    if (!hex || seen.has(hex)) continue;
    seen.add(hex);
    out.push(name ? { hex, name } : { hex });
  }

  return out;
}

function expandHex(hex: string): string {
  if (hex.length === 4) {
    return "#" + hex.slice(1).split("").map((c) => c + c).join("");
  }
  return hex;
}

/**
 * Parse typography text into { heading, body }. Accepts `Heading, Body` or a
 * single family used for both. Snaps to the allowlist (case-insensitive) so
 * downstream `loadGoogleFont` actually finds a match.
 */
export function parseTypographyText(text: string): Typography | null {
  const tokens = text
    .split(/[,\n/|]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (tokens.length === 0) return null;

  const heading = snapToAllowlist(tokens[0]);
  const body = tokens[1] ? snapToAllowlist(tokens[1]) : heading;
  if (!heading || !body) return null;
  return { heading, body };
}

function snapToAllowlist(token: string): string | null {
  const lc = token.toLowerCase();
  const hit = BRAND_FONT_ALLOWLIST.find((f) => f.toLowerCase() === lc);
  return hit ?? token; // fall back to raw token — loadGoogleFont will no-op safely
}

/** Mood text is freeform — just trim. Caller decides if empty is valid. */
export function parseMoodText(text: string): string {
  return text.trim();
}
