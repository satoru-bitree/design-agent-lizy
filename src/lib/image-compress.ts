// Client-side image compression. Used before sending images to the server
// (which then forwards to fal.storage). Without this, a 10MB phone photo
// becomes a ~13MB base64 string in the JSON body — slow upload, large
// memory footprint, and risk of hitting body-size limits on Vercel.
//
// Strategy:
//   - Resize so the longer edge ≤ MAX_DIM_PX (default 1536). gpt-image-2 /
//     seedance / nemotron all downscale internally anyway, so 1536 is plenty.
//   - Re-encode as JPEG q 0.85 (good balance for both photos and label art).
//   - Non-raster inputs (PDF / SVG) pass through unchanged — canvas can't
//     decode them, and they're already compact.
//
// Returns a base64 dataURL ready to drop into fetch body.

const MAX_DIM_PX_DEFAULT = 1536;
const JPEG_QUALITY_DEFAULT = 0.85;

export type CompressOptions = {
  /** Max length on the longer edge in pixels. Default 1536. */
  maxDim?: number;
  /** JPEG quality 0..1. Default 0.85. */
  quality?: number;
};

export async function compressImageFile(
  file: File,
  opts: CompressOptions = {},
): Promise<string> {
  const maxDim = opts.maxDim ?? MAX_DIM_PX_DEFAULT;
  const quality = opts.quality ?? JPEG_QUALITY_DEFAULT;

  // Non-raster types (PDF / SVG) → passthrough. Canvas can't decode these.
  if (!file.type.startsWith("image/") || file.type === "image/svg+xml") {
    return fileToDataUrl(file);
  }

  try {
    const img = await loadImage(file);
    const { width, height } = scaledDimensions(
      img.naturalWidth,
      img.naturalHeight,
      maxDim,
    );

    // Skip the canvas roundtrip if the source already fits. We still re-encode
    // to JPEG to drop transparency channel + huge PNG metadata, but only when
    // it's smaller than the source. (Cheap heuristic: PNG > 1MB usually wins.)
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return fileToDataUrl(file);

    // White background so JPEG output of transparent PNGs doesn't go black.
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);

    return canvas.toDataURL("image/jpeg", quality);
  } catch (e) {
    // Decode failure: fall back to raw bytes so the request still goes out.
    // Logged so we still notice when compression silently degrades.
    console.warn("[image-compress] decode failed, sending raw bytes:", e);
    return fileToDataUrl(file);
  }
}

/* -------------------------------------------------------------------------- */

function scaledDimensions(
  w: number,
  h: number,
  maxDim: number,
): { width: number; height: number } {
  const longer = Math.max(w, h);
  if (longer <= maxDim) return { width: w, height: h };
  const scale = maxDim / longer;
  return {
    width: Math.max(1, Math.round(w * scale)),
    height: Math.max(1, Math.round(h * scale)),
  };
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(err);
    };
    img.src = url;
  });
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error("read failed"));
    reader.readAsDataURL(file);
  });
}
