// Curated Google Fonts allowlist + on-demand loader.
//
// Used for two things:
// 1. Constraining the brand-analysis vision LLM to fonts we can actually
//    render in the browser (the prompt embeds this list).
// 2. Injecting a <link rel="stylesheet"> on the client so the analyzed
//    font visually appears in the brand panel — otherwise the browser
//    silently falls back to Inter/Manrope and typography looks identical
//    across every brand.
//
// All entries are guaranteed to exist on https://fonts.google.com.

/**
 * Korean Google-Fonts companions. Latin display faces (Bodoni / Bebas / etc.)
 * have no Korean glyphs, so Korean text in body samples otherwise always
 * falls back to Pretendard regardless of brand. We pair each Latin family
 * with a Korean face that carries similar mood (serif↔serif, display↔display,
 * script↔script) so 한글 본문도 브랜드 결을 따라간다.
 */
const KOREAN_COMPANION_FONTS = [
  "Noto Sans KR",
  "Noto Serif KR",
  "IBM Plex Sans KR",
  "Hahmlet",
  "Gowun Batang",
  "Gowun Dodum",
  "Nanum Myeongjo",
  "Nanum Pen Script",
  "Black Han Sans",
  "Do Hyeon",
  "Jua",
  "Stylish",
] as const;

const KOREAN_COMPANION: Record<string, (typeof KOREAN_COMPANION_FONTS)[number]> = {
  // Serif — luxury / heritage → Hahmlet (modern bodoni-style hangul) / Noto Serif KR
  "Playfair Display": "Noto Serif KR",
  Lora: "Noto Serif KR",
  "Cormorant Garamond": "Hahmlet",
  "EB Garamond": "Hahmlet",
  "Crimson Pro": "Noto Serif KR",
  "DM Serif Display": "Hahmlet",
  "Tenor Sans": "Gowun Batang",
  Italiana: "Hahmlet",
  "Libre Baskerville": "Noto Serif KR",
  Merriweather: "Noto Serif KR",
  "PT Serif": "Noto Serif KR",
  "Bodoni Moda": "Hahmlet",
  Cardo: "Noto Serif KR",
  // Sans — tech / modern → Noto Sans KR / IBM Plex Sans KR
  Inter: "IBM Plex Sans KR",
  Manrope: "IBM Plex Sans KR",
  Poppins: "Noto Sans KR",
  Montserrat: "Noto Sans KR",
  Roboto: "Noto Sans KR",
  Lato: "Noto Sans KR",
  "Work Sans": "Noto Sans KR",
  "DM Sans": "Gowun Dodum",
  "Plus Jakarta Sans": "Noto Sans KR",
  Outfit: "Gowun Dodum",
  "Space Grotesk": "IBM Plex Sans KR",
  "Public Sans": "Noto Sans KR",
  Mulish: "Noto Sans KR",
  Rubik: "Noto Sans KR",
  Karla: "Noto Sans KR",
  Quicksand: "Gowun Dodum",
  Comfortaa: "Gowun Dodum",
  "Josefin Sans": "Stylish",
  Nunito: "Gowun Dodum",
  // Display — bold poster → Black Han Sans / Do Hyeon
  "Bebas Neue": "Black Han Sans",
  Anton: "Black Han Sans",
  Oswald: "Black Han Sans",
  "Archivo Black": "Black Han Sans",
  "Abril Fatface": "Do Hyeon",
  "Big Shoulders Display": "Black Han Sans",
  // Script — handwritten → Nanum Pen Script
  Pacifico: "Nanum Pen Script",
  "Dancing Script": "Nanum Pen Script",
  Caveat: "Nanum Pen Script",
  Lobster: "Jua",
  Sacramento: "Nanum Pen Script",
  "Great Vibes": "Nanum Pen Script",
  "Kaushan Script": "Nanum Pen Script",
  // Slab — Stylish
  "Roboto Slab": "Stylish",
  "Zilla Slab": "Stylish",
  Bitter: "Stylish",
  // Mono — Korean falls back to a sans companion
  "JetBrains Mono": "IBM Plex Sans KR",
  "Space Mono": "IBM Plex Sans KR",
  "IBM Plex Mono": "IBM Plex Sans KR",
  "Fira Code": "IBM Plex Sans KR",
  "Source Code Pro": "IBM Plex Sans KR",
};

export const BRAND_FONT_ALLOWLIST = [
  // Sans — modern / tech
  "Inter",
  "Manrope",
  "Poppins",
  "Montserrat",
  "Roboto",
  "Lato",
  "Work Sans",
  "DM Sans",
  "Plus Jakarta Sans",
  "Outfit",
  "Space Grotesk",
  "Public Sans",
  "Mulish",
  "Rubik",
  "Karla",
  // Sans — geometric / friendly
  "Quicksand",
  "Comfortaa",
  "Josefin Sans",
  "Nunito",
  // Serif — luxury / heritage
  "Playfair Display",
  "Lora",
  "Cormorant Garamond",
  "EB Garamond",
  "Crimson Pro",
  "DM Serif Display",
  "Tenor Sans",
  "Italiana",
  "Libre Baskerville",
  "Merriweather",
  "PT Serif",
  "Bodoni Moda",
  "Cardo",
  // Display — bold poster
  "Bebas Neue",
  "Anton",
  "Oswald",
  "Archivo Black",
  "Abril Fatface",
  "Big Shoulders Display",
  // Script — decorative
  "Pacifico",
  "Dancing Script",
  "Caveat",
  "Lobster",
  "Sacramento",
  "Great Vibes",
  "Kaushan Script",
  // Slab
  "Roboto Slab",
  "Zilla Slab",
  "Bitter",
  // Mono
  "JetBrains Mono",
  "Space Mono",
  "IBM Plex Mono",
  "Fira Code",
  "Source Code Pro",
] as const;

const ALLOWED = new Set<string>([
  ...BRAND_FONT_ALLOWLIST,
  ...KOREAN_COMPANION_FONTS,
]);

/** Pull the first family name out of a CSS font-family string. */
export function primaryFamily(family: string | undefined): string | null {
  if (!family) return null;
  const first = family.split(",")[0].trim().replace(/^['"]|['"]$/g, "");
  return first.length > 0 ? first : null;
}

export function isAllowedFont(family: string | undefined): boolean {
  const first = primaryFamily(family);
  return first ? ALLOWED.has(first) : false;
}

const loaded = new Set<string>();

/**
 * Inject a Google Fonts <link> for the given family name (idempotent).
 * No-op on the server, no-op for unknown / disallowed fonts (so we don't
 * 404 on every weird LLM hallucination), no-op if already loaded.
 */
export function loadGoogleFont(family: string | undefined): void {
  if (typeof document === "undefined") return;
  const first = primaryFamily(family);
  if (!first || !ALLOWED.has(first)) return;
  if (loaded.has(first)) return;
  loaded.add(first);

  const url =
    "https://fonts.googleapis.com/css2?family=" +
    encodeURIComponent(first).replace(/%20/g, "+") +
    ":ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400;1,700&display=swap";

  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = url;
  link.dataset.brandFont = first;
  document.head.appendChild(link);
}

/**
 * Look up the Korean Google-Fonts companion for a Latin brand family.
 * Returns null if no mapping (e.g. unknown family).
 */
export function koreanCompanion(family: string | undefined): string | null {
  const first = primaryFamily(family);
  if (!first) return null;
  return KOREAN_COMPANION[first] ?? null;
}

/**
 * Load a Latin family AND its Korean companion in one shot. Either step is a
 * no-op when there is no allowlist match.
 */
export function loadBrandFontWithKorean(family: string | undefined): void {
  loadGoogleFont(family);
  loadGoogleFont(koreanCompanion(family) ?? undefined);
}
