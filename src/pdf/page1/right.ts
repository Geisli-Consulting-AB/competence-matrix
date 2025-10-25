import jsPDF from 'jspdf';
import type { Metrics } from '../shared';

function rightColumn(m: Metrics) {
  const x = m.leftColW + m.leftPadding;
  const width = m.pageW - x - m.rightPadding;
  return { x, width };
}

function setTextStyle(doc: jsPDF) {
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
}

function addTitle(doc: jsPDF, text: string, x: number, y: number, maxWidth: number) {
  doc.setFontSize(24);
  doc.text(text, x, y, { maxWidth });
  return y + 28; // next baseline
}

function wrap(doc: jsPDF, text: string, maxWidth: number): string[] {
  return doc.splitTextToSize(text, maxWidth);
}

function addBodyFirstPage(
  doc: jsPDF,
  lines: string[],
  x: number,
  startY: number,
  bottomY: number,
  lineH = 16,
): { consumed: number; overflow: string } {
  doc.setFontSize(12);
  let y = startY;
  let i = 0;
  for (; i < lines.length; i++) {
    if (y > bottomY) break;
    doc.text(lines[i], x, y);
    y += lineH;
  }
  const overflow = i < lines.length ? lines.slice(i).join('\n') : '';
  return { consumed: i, overflow };
}

function addBodyNextPages(doc: jsPDF, text: string, m: Metrics, lineH = 16) {
  if (!text) return;
  const usableW = m.pageW - m.subsequentMarginL - m.subsequentMarginR;
  const pageLines = doc.splitTextToSize(text, usableW);
  let y = 60;
  for (let i = 0; i < pageLines.length; i++) {
    if (y > m.pageH - m.bottomMargin) {
      doc.addPage();
      y = 60;
    }
    doc.text(pageLines[i], m.subsequentMarginL, y);
    y += lineH;
  }
}

// Build the right column of page 1 (title + description with wrapping and overflow handling)
export function buildRightColumn(doc: jsPDF, m: Metrics, name?: string, description?: string) {
  setTextStyle(doc);
  const { x, width } = rightColumn(m);

  const title = (name?.trim() || '').slice(0, 200) || 'Curriculum Vitae';
  const body = (description || '').toString();

  const titleTopY = 80;
  const afterTitleY = addTitle(doc, title, x, titleTopY, width);

  const firstPageBottom = m.pageH - m.bottomMargin;
  const lines = wrap(doc, body, width);
  const { overflow } = addBodyFirstPage(doc, lines, x, afterTitleY, firstPageBottom);

  if (overflow) {
    doc.addPage();
    addBodyNextPages(doc, overflow, m);
  }
}
