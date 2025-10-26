import jsPDF from 'jspdf';
import type { Metrics } from '../../shared';
import { setFontStyle } from '../../shared';
import { getPdfStrings } from '../../../i18n';
import type { PdfLang } from '../../../i18n';
import { SPACING } from '../constants';

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
  setFontStyle(doc, 'bold');
  doc.setFontSize(14);
  doc.text(t.languagesTitle, x, y);
  y += SPACING.HEADING_UNDERLINE;

  // Underline
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(1.5);
  const lineRight = m.leftColW - m.leftPadding;
  doc.line(x, y, lineRight, y);
  y += SPACING.SECTION_HEADER;

  // Body
  setFontStyle(doc, 'normal');
  doc.setFontSize(12);
  
  // Circle properties
  const circleX = x + SPACING.BULLET_RADIUS;
  
  for (const language of languages) {
    const t = (language || '').trim();
    if (!t) continue;
    
    // Draw circle
    doc.setFillColor(255, 255, 255);
    doc.circle(circleX, y - SPACING.BULLET_Y_OFFSET, SPACING.BULLET_RADIUS, 'F');
    
    // Add text with some spacing from the circle
    doc.text(t, x + SPACING.BULLET_TEXT_PADDING, y);
    y += SPACING.LIST_ITEM;
    
    // Prevent overflow
    if (y > m.pageH - m.bottomMargin) {
      y = m.pageH - m.bottomMargin;
      break;
    }
  }

  return y;
}
