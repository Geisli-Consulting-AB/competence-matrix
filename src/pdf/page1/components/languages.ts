import jsPDF from 'jspdf';
import type { Metrics } from '../../shared';
import { useFont } from '../../shared';
import { getPdfStrings } from '../../../i18n';
import type { PdfLang } from '../../../i18n';

// Add languages block beneath the given startY; stops if reaching the bottom margin
export async function addLanguages(
  doc: jsPDF,
  m: Metrics,
  startY: number,
  languages: string[],
  lang: PdfLang = 'en',
): Promise<number> {
  const x = m.leftPadding;
  let y = startY;

  // Only proceed if there are languages to display
  if (!Array.isArray(languages) || languages.length === 0) {
    return startY;
  }

  // Add some space from the previous section
  y += 8;

  // Get translations
  const t = getPdfStrings(lang);

  // Heading
  doc.setTextColor(255, 255, 255);
  useFont(doc, 'bold');
  doc.setFontSize(14);
  doc.text(t.languagesTitle, x, y);
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
  
  // Circle properties
  const circleRadius = 2;
  const circleX = x + circleRadius;
  const circleYOffset = 4; // Vertical adjustment to align circle with text
  
  for (const language of languages) {
    const t = (language || '').trim();
    if (!t) continue;
    
    // Draw circle
    doc.setFillColor(255, 255, 255);
    doc.circle(circleX, y - circleYOffset, circleRadius, 'F');
    
    // Add text with some spacing from the circle
    doc.text(t, x + 10, y);
    y += 16;
    
    // Prevent overflow
    if (y > m.pageH - m.bottomMargin) {
      y = m.pageH - m.bottomMargin;
      break;
    }
  }

  return y;
}
