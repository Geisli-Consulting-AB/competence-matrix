import jsPDF from 'jspdf';
import type { Metrics } from '../../shared';
import { loadImage, useFont } from '../../shared';
import envelopePng from '../../../assets/envelope.png';
import telephonePng from '../../../assets/telephone.png';
import placePng from '../../../assets/place.png';
import globePng from '../../../assets/globe.png';

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

// Add contact block beneath the avatar; returns next baseline Y after the section
export async function addContact(doc: jsPDF, m: Metrics, startY: number, strings: { contactTitle: string }): Promise<number> {
  const x = m.leftPadding;
  let y = Math.max(startY, 140);

  // Heading
  doc.setTextColor(255, 255, 255);
  useFont(doc, 'bold');
  doc.setFontSize(14);
  doc.text(strings.contactTitle, x, y);
  y += 6;

  // Underline
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(1.5);
  const lineRight = m.leftColW - m.leftPadding;
  doc.line(x, y, lineRight, y);
  y += 16;

  // Body
  useFont(doc, 'normal');
  doc.setFontSize(12);

  const iconSize = 12;
  const gap = 6;

  y = await drawIconTextLine(doc, envelopePng as unknown as string, 'sale@geisli.se', x, y, iconSize, gap);
  y = await drawIconTextLine(doc, telephonePng as unknown as string, '076-810 17 22', x, y, iconSize, gap);
  y = await drawIconTextLine(doc, placePng as unknown as string, 'Tegnérgatan 34, Stockholm', x, y, iconSize, gap);
  y = await drawIconTextLine(doc, globePng as unknown as string, 'geisli.se', x, y, iconSize, gap);

  return y + 10; // small spacing before next section
}
