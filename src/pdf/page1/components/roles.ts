import jsPDF from 'jspdf';
import type { Metrics } from '../../shared';
import { useFont } from '../../shared';

// Add roles block beneath the given startY; stops if reaching the bottom margin
export async function addRoles(
  doc: jsPDF,
  m: Metrics,
  startY: number,
  roles: string[],
  strings: { rolesTitle: string },
) {
  const x = m.leftPadding;
  let y = Math.max(startY, 140);

  // Heading
  doc.setTextColor(255, 255, 255);
  useFont(doc, 'bold');
  doc.setFontSize(14);
  doc.text(strings.rolesTitle, x, y);
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
  for (const role of roles) {
    const t = (role || '').trim();
    if (!t) continue;
    doc.text(t, x, y);
    y += 16;
    if (y > m.pageH - m.bottomMargin) break; // prevent overflow for now
  }
}
