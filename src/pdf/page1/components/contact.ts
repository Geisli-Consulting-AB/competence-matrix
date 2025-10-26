import jsPDF from 'jspdf';
import type { Metrics } from '../../shared';
import { loadImage, useFont } from '../../shared';
import { getPdfStrings } from '../../../i18n';
import type { PdfLang } from '../../../i18n';
import { SPACING } from '../constants';

// Import images using Vite's import syntax
const envelopePng = new URL('../../../assets/envelope.png', import.meta.url).href;
const telephonePng = new URL('../../../assets/telephone.png', import.meta.url).href;
const placePng = new URL('../../../assets/place.png', import.meta.url).href;
const globePng = new URL('../../../assets/globe.png', import.meta.url).href;

// Draw a PNG icon aligned with text baseline
async function drawPngIcon(doc: jsPDF, url: string, x: number, baselineY: number, size = 12) {
  try {
    // If it's already a data URL, use it directly
    if (url.startsWith('data:')) {
      doc.addImage(url, 'PNG', x, baselineY - Math.round(size * 0.8), size, size, undefined, 'FAST');
      return;
    }
    
    // Otherwise, try to load it
    const img = await loadImage(url);
    const top = baselineY - Math.round(size * 0.8);
    doc.addImage(img, 'PNG', x, top, size, size, undefined, 'FAST');
  } catch (error) {
    console.error('Error drawing icon:', { url, error });
    // Draw a simple rectangle as fallback
    doc.rect(x, baselineY - Math.round(size * 0.8), size, size);
  }
}

// Draw one contact line (icon + text) and return the next baseline Y
async function drawIconTextLine(
  doc: jsPDF,
  iconUrl: string,
  text: string,
  x: number,
  y: number,
  iconSize = 12,
  gap = 6,
  lineH = SPACING.LIST_ITEM,
): Promise<number> {
  await drawPngIcon(doc, iconUrl, x, y, iconSize);
  const textX = x + iconSize + gap;
  doc.text(text, textX, y);
  return y + lineH;
}

// Add contact block beneath the avatar; returns next baseline Y after the section
export async function addContact(doc: jsPDF, m: Metrics, startY: number, lang: PdfLang = 'en'): Promise<number> {
  const x = m.leftPadding;
  let y = Math.max(startY, 140);

  // Get translations
  const t = getPdfStrings(lang);

  // Heading
  doc.setTextColor(255, 255, 255);
  useFont(doc, 'bold');
  doc.setFontSize(14);
  doc.text(t.contactTitle, x, y);
  y += SPACING.HEADING_UNDERLINE;

  // Underline
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(1.5);
  const lineRight = m.leftColW - m.leftPadding;
  doc.line(x, y, lineRight, y);
  y += SPACING.SECTION_HEADER;

  // Body
  useFont(doc, 'normal');
  doc.setFontSize(12);

  const iconSize = 12;
  const gap = SPACING.BULLET_TEXT_PADDING;

  y = await drawIconTextLine(doc, envelopePng as unknown as string, 'sale@geisli.se', x, y, iconSize, gap);
  y = await drawIconTextLine(doc, telephonePng as unknown as string, '076-810 17 22', x, y, iconSize, gap);
  y = await drawIconTextLine(doc, placePng as unknown as string, 'Tegnérgatan 34, Stockholm', x, y, iconSize, gap);
  y = await drawIconTextLine(doc, globePng as unknown as string, 'geisli.se', x, y, iconSize, gap);

  return y + SPACING.SECTION_BOTTOM_MARGIN;
}
