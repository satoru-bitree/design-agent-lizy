// Trigger a browser download for a remote asset URL (fal CDN PNGs / MP4s, etc).
// Fetches the URL as a blob first so the `download` attribute is respected even
// for cross-origin assets where the browser would otherwise navigate to the
// resource instead of saving it. Falls back to opening the URL in a new tab on
// fetch failure (typically a CORS rejection) so the user can still right-click
// → save image.
export async function downloadFile(
  url: string,
  filename: string,
): Promise<void> {
  try {
    const res = await fetch(url, { mode: "cors" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    // Defer revoke so the click has time to register the URL on Safari.
    setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  } catch (e) {
    console.error("[download] fetch failed, opening in new tab:", e);
    window.open(url, "_blank", "noopener,noreferrer");
  }
}

const FILENAME_SAFE = /[^a-zA-Z0-9가-힣\-_\s]/g;
const EXT_FROM_URL = /\.(png|jpg|jpeg|webp|mp4|webm|mov)(?:[?#]|$)/i;

/**
 * Build a kebab-cased filename for a download. Prefers `hint` text (e.g.
 * variant label / alt) as the base name; falls back to `fallback`. Pulls the
 * extension from the URL path; defaults to `defaultExt` when not detectable.
 */
export function deriveDownloadFilename(
  url: string,
  hint: string | undefined,
  fallback: string,
  defaultExt = "png",
): string {
  const ext = url.match(EXT_FROM_URL)?.[1]?.toLowerCase() ?? defaultExt;
  const base = (hint ?? fallback)
    .replace(FILENAME_SAFE, "")
    .trim()
    .replace(/\s+/g, "-");
  return `${base || fallback}.${ext}`;
}
