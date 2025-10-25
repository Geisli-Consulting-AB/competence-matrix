import jsPDF from 'jspdf';
import { circleCropToPng, loadImage } from '../shared';
import type { Metrics } from '../shared';
import envelopePng from '../../assets/envelope.png';
import telephonePng from '../../assets/telephone.png';
import placePng from '../../assets/place.png';
import globePng from '../../assets/globe.png';

// Left column background: #101b29
export function drawSidebar(doc: jsPDF, m: Metrics) {
  doc.setFillColor(16, 27, 41);
  doc.rect(0, 0, m.leftColW, m.pageH, 'F');
}

// Draw a circular avatar at the top of the left column, centered, with thick border (#3e4d69)
// Returns the baseline Y to continue content beneath the avatar
export async function drawAvatarInSidebar(doc: jsPDF, m: Metrics, dataUrl?: string): Promise<number> {
  const defaultStartY = 140;
  if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image')) {
    return defaultStartY;
  }

  const paddingTop = 40;
  const sidePadding = 18;
  const maxDiameter = Math.min(m.leftColW - sidePadding * 2, 160);
  const r = Math.max(30, Math.floor(maxDiameter / 2));
  const cx = Math.floor(m.leftColW / 2);
  const cy = paddingTop + r;

  let cropped = dataUrl;
  try {
    cropped = await circleCropToPng(dataUrl, r * 2);
  } catch {
    // ignore
  }

  doc.addImage(cropped, 'PNG', cx - r, cy - r, r * 2, r * 2, undefined, 'FAST');

  // Border color: #3e4d69
  doc.setLineWidth(20);
  doc.setDrawColor(62, 77, 105);
  doc.circle(cx, cy, r, 'S');

  return cy + r + 30;
}

// Draw a PNG icon aligned with text baseline
async function drawPngIcon(doc: jsPDF, url: string, x: number, baselineY: number, size = 12) {
  const img = await loadImage(url);
  const top = baselineY - Math.round(size * 0.8);
  doc.addImage(img, 'PNG', x, top, size, size, undefined, 'FAST');
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
  lineH = 16,
): Promise<number> {
  await drawPngIcon(doc, iconUrl, x, y, iconSize);
  const textX = x + iconSize + gap;
  doc.text(text, textX, y);
  return y + lineH;
}

// Add contact block beneath the avatar
export async function addContact(doc: jsPDF, m: Metrics, startY: number) {
  const x = m.leftPadding;
  let y = Math.max(startY, 140);

  // Heading
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('Kontakt', x, y);
  y += 6;

  // Underline
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(1.5);
  const lineRight = m.leftColW - m.leftPadding;
  doc.line(x, y, lineRight, y);
  y += 16;

  // Body
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);

  const iconSize = 12;
  const gap = 6;

  y = await drawIconTextLine(doc, envelopePng as unknown as string, 'sale@geisli.se', x, y, iconSize, gap);
  y = await drawIconTextLine(doc, telephonePng as unknown as string, '076-810 17 22', x, y, iconSize, gap);
  y = await drawIconTextLine(doc, placePng as unknown as string, 'Tegnérgatan 34, Stockholm', x, y, iconSize, gap);
  y = await drawIconTextLine(doc, globePng as unknown as string, 'geisli.se', x, y, iconSize, gap);
}

// Build the left column of page 1
export async function buildLeftColumn(doc: jsPDF, m: Metrics, photoDataUrl?: string) {
  drawSidebar(doc, m);
  const contactStartY = await drawAvatarInSidebar(doc, m, photoDataUrl);
  await addContact(doc, m, contactStartY);
}
