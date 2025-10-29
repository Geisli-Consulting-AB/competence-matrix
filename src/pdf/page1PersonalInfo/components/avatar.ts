import jsPDF from 'jspdf';
import { circleCropToPng } from '../../shared';
import type { Metrics } from '../../shared';

/**
 * Draw a circular avatar at the top of the left column, centered, with a thick border (#3e4d69).
 * Returns the baseline Y to continue content beneath the avatar.
 */
export async function addAvatar(doc: jsPDF, m: Metrics, dataUrl?: string): Promise<number> {
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
    // ignore cropping errors and fall back to original
  }

  doc.addImage(cropped, 'PNG', cx - r, cy - r, r * 2, r * 2, undefined, 'FAST');

  // Border color: #3e4d69
  doc.setLineWidth(20);
  doc.setDrawColor(62, 77, 105);
  doc.circle(cx, cy, r, 'S');

  return cy + r + 30;
}
