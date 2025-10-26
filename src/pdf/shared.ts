import jsPDF from 'jspdf';

// ---------- Shared helpers and types ----------

export function newDoc() {
  return new jsPDF({ unit: 'pt', format: 'a4' });
}

// ---- Inter font support ----
let interReady = false;
const INTER_FAMILY = 'Inter';

// Inter font embedding: To avoid any runtime network requests and 404s, we currently do not
// fetch or embed external font files. PDFs will use built-in Helvetica by default.
// If you want Inter embedded offline, place Inter-Regular.ttf and Inter-Bold.ttf under src/assets
// and wire them here using Vite `?url` imports, then add them to jsPDF via addFileToVFS/addFont.

/** Ensure Inter Regular/Bold fonts are registered on the given jsPDF document.
 *  Currently a no-op to avoid external fetches. Falls back to Helvetica. */
export async function ensureInterFonts(): Promise<void> {
  interReady = false; // keep using Helvetica via useFont
}

/** Set the text font to Inter when available, otherwise Helvetica. */
export function setFontStyle(doc: jsPDF, style: 'normal' | 'bold' = 'normal') {
  if (interReady) {
    doc.setFont(INTER_FAMILY, style);
  } else {
    doc.setFont('helvetica', style);
  }
}

// Image utilities (browser-only)
export async function loadImage(dataUrlOrUrl: string): Promise<HTMLImageElement> {
  // If it's already a data URL, use it directly
  if (dataUrlOrUrl.startsWith('data:')) {
    const img = new Image();
    return new Promise((resolve) => {
      img.onload = () => resolve(img);
      img.onerror = (e) => {
        console.error('[PDF] loadImage: failed to load data URL image', { error: e });
        // Return a transparent 1x1 pixel as fallback
        const fallback = new Image();
        fallback.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
        resolve(fallback);
      };
      img.src = dataUrlOrUrl;
    });
  }

  // Handle regular URLs
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => {
      console.error('[PDF] loadImage: failed to load image', { src: dataUrlOrUrl, error: e });
      // Return a transparent 1x1 pixel as fallback
      const fallback = new Image();
      fallback.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
      resolve(fallback);
    };
    img.src = dataUrlOrUrl;
  });
}

// Crop an image into a circle with transparent outside and return a PNG data URL
export async function circleCropToPng(dataUrl: string, diameterPx: number): Promise<string> {
  const img = await loadImage(dataUrl);
  const canvas = document.createElement('canvas');
  canvas.width = diameterPx;
  canvas.height = diameterPx;
  const ctx = canvas.getContext('2d');
  if (!ctx) return dataUrl;

  // Draw circular clipping path
  const r = diameterPx / 2;
  ctx.save();
  ctx.beginPath();
  ctx.arc(r, r, r, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();

  // Cover strategy (like object-fit: cover) to fill the circle
  const scale = Math.max(diameterPx / img.width, diameterPx / img.height);
  const drawW = img.width * scale;
  const drawH = img.height * scale;
  const dx = (diameterPx - drawW) / 2;
  const dy = (diameterPx - drawH) / 2;
  ctx.drawImage(img, dx, dy, drawW, drawH);
  ctx.restore();

  return canvas.toDataURL('image/png');
}

export type Metrics = {
  pageW: number;
  pageH: number;
  leftColW: number;
  rightPadding: number;
  leftPadding: number;
  bottomMargin: number;
  subsequentMarginL: number;
  subsequentMarginR: number;
};

export function getMetrics(): Metrics {
  const pageW = 595;
  const pageH = 842;
  return {
    pageW,
    pageH,
    leftColW: Math.round(pageW * 0.4),
    rightPadding: 24,
    leftPadding: 24,
    bottomMargin: 30,
    subsequentMarginL: 70,
    subsequentMarginR: 70,
  };
}

export function toBlob(doc: jsPDF): Blob {
  return doc.output('blob');
}

/** Trigger a client-side download for a Blob under the provided filename. */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Build a safe file name from a user name, e.g., "Uzi Landsmann - CV.pdf" */
export function filenameFromUserName(name?: string) {
  const clean = (name || '').trim();
  if (!clean) return 'CV.pdf';
  const safe = clean.replace(/[^A-Za-z0-9 ._-]+/g, '').replace(/\s+/g, ' ').trim();
  return `${safe} - CV.pdf`;
}
