import { jsPDF } from "jspdf";
import type { PdfLang, TranslationStrings } from "../../i18n";
import LAYOUT from "../constants/layout";
import type { Metrics } from "../shared";

export interface CompetenceItem {
  name: string;
  level: number; // 1-5 or 1-10 scale, depending on your preference
}

export interface CompetenceCategory {
  category: string;
  items: CompetenceItem[];
}

export interface Page4Options {
  lang?: PdfLang;
  strings?: TranslationStrings;
  competences?: CompetenceCategory[];
}
/**
 * Builds the fourth page of the CV - Competences
 */
export async function buildCompetencesPage(
  doc: jsPDF,
  m: Metrics,
  options: Page4Options = { lang: "en" }
): Promise<void> {
  // Get translations
  const { getPdfStrings } = await import("../../i18n");
  const strings = options.strings || getPdfStrings(options.lang || "en");

  // Set initial Y position with proper top margin
  let y = LAYOUT.MARGIN.TOP * 1.5;

  // Set default font
  doc.setFont("helvetica", "normal");
  doc.setFontSize(LAYOUT.FONT.BODY);
  doc.setTextColor(0, 0, 0);

  // Add page title
  const title = strings.competences;
  doc.setFontSize(LAYOUT.FONT.TITLE);
  doc.setFont("helvetica", "bold");
  doc.text(title, m.leftPadding, y);
  y += LAYOUT.SPACING.SECTION_HEADER;

  // Add a line under the title
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.line(m.leftPadding, y, m.pageW - m.rightPadding, y);
  y += LAYOUT.SPACING.HEADING_UNDERLINE / 2; // Match spacing from other sections

  // Add space after the line, before the first competence level
  y += LAYOUT.SPACING.SECTION_HEADER;

  // Group competences by level (only levels 2-4)
  const competencesByLevel: Record<number, string[]> = {
    2: [],
    3: [],
    4: [],
  };

  // Process competences from all categories
  options.competences?.forEach((category) => {
    if (category && category.items) {
      category.items.forEach((item) => {
        if (item && item.name && typeof item.level === "number") {
          const level = Math.max(2, Math.min(4, item.level)); // Ensure level is between 2 and 4
          if (level >= 2 && level <= 4) {
            competencesByLevel[level].push(item.name);
          }
        }
      });
    }
  });

  // Check if we have any competences to display
  const hasCompetences = Object.values(competencesByLevel).some(
    (competences) => competences.length > 0
  );
  if (!hasCompetences) {
    console.warn("No competences found to display in PDF");
    return Promise.resolve();
  }

  // Level labels for competences (levels 2-4)
  const levelLabels: Record<number, string> = {
    2: "Beginner",
    3: "Proficient",
    4: "Expert",
  };

  // Set up two-column layout using the same layout as other sections
  const leftColWidth = LAYOUT.LEFT_COLUMN * 3.78; // Convert mm to points (1mm = 3.78 points)
  const rightColX = m.leftPadding + leftColWidth + LAYOUT.GUTTER * 3.78;
  const col1X = m.leftPadding;
  const col2X = rightColX;

  // Use consistent spacing from LAYOUT constants
  const lineHeight = LAYOUT.SPACING.LIST_ITEM * 0.8; // Slightly smaller than list item spacing

  // Set default top margin
  const top = 50; // Default top margin in points

  // Set font for the content
  doc.setFont("helvetica", "normal");
  doc.setFontSize(LAYOUT.FONT.BODY);

  // Draw each level and its competences
  Object.entries(competencesByLevel)
    .filter(([, competences]) => competences.length > 0) // Only show levels with competences
    .sort(([a], [b]) => Number(b) - Number(a)) // Sort by level (highest first)
    .forEach(([level, competences]) => {
      // Check if we need a new page (leave space for at least 2 lines)
      if (y > m.pageH - 2 * lineHeight - LAYOUT.SPACING.SECTION_BOTTOM_MARGIN) {
        doc.addPage();
        y = top;
      }

      // Draw level in the left column (bold and slightly larger)
      doc.setFont("helvetica", "bold");
      doc.setFontSize(LAYOUT.FONT.SUBTITLE);
      doc.text(levelLabels[Number(level)] || `Level ${level}`, col1X, y);

      // Draw competences in the right column
      doc.setFont("helvetica", "normal");
      doc.setFontSize(LAYOUT.FONT.BODY);

      const competencesText = competences.join(", ");

      // Split text into multiple lines if needed
      const splitText = doc.splitTextToSize(
        competencesText,
        m.pageW - col2X - m.rightPadding // Available width for text
      );

      // Draw each line of competences
      splitText.forEach((line: string, i: number) => {
        if (i > 0 && y > m.pageH - 2 * LAYOUT.SPACING.LIST_ITEM) {
          doc.addPage();
          y = top;

          // Redraw the level label on the new page if this is a continuation
          if (i > 0) {
            doc.setFont("helvetica", "bold");
            doc.setFontSize(LAYOUT.FONT.SUBTITLE);
            doc.text(levelLabels[Number(level)] || `Level ${level}`, col1X, y);
            doc.setFont("helvetica", "normal");
            doc.setFontSize(LAYOUT.FONT.BODY);
          }
        }

        doc.text(line, col2X, y);
        y += lineHeight;
      });

      // Add consistent spacing after each level
      y += LAYOUT.SPACING.SECTION_HEADER;
    });

  return Promise.resolve();
}

// Export the main function as default
export default buildCompetencesPage;
