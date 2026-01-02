import { jsPDF } from "jspdf";
import type { Metrics } from "../../shared";
import type { Page3Options } from "../page3";
import LAYOUT from "../../constants/layout";
import type { TranslationStrings } from "../../../i18n";

interface EducationItem {
  school: string;
  degree: string;
  fieldOfStudy?: string;
  startYear: string;
  endYear: string;
  ongoing?: boolean;
  description?: string;
}

export interface EducationSectionOptions extends Page3Options {
  strings?: TranslationStrings;
  educations?: EducationItem[];
  // Add any specific options for education section here
}

export async function buildEducationSection(
  doc: jsPDF,
  m: Metrics,
  y: number,
  options: EducationSectionOptions = {}
): Promise<number> {
  const { strings = {} as TranslationStrings, educations = [] } = options;
  const title = strings.education || "Education";

  // Calculate column positions using the same layout as experience section
  const leftColWidth = LAYOUT.LEFT_COLUMN * 3.78; // Convert mm to points (1mm = 3.78 points)
  const rightColX = m.leftPadding + leftColWidth + LAYOUT.GUTTER * 3.78;
  const rightColWidth = m.pageW - rightColX - m.rightPadding;

  // Add section title
  doc.setFontSize(LAYOUT.FONT.TITLE);
  doc.setFont("helvetica", "bold");
  doc.text(title, m.leftPadding, y);

  // Add a line under the title
  y += LAYOUT.SPACING.SECTION_HEADER;
  doc.setDrawColor(200, 200, 200);
  doc.line(m.leftPadding, y, m.pageW - m.rightPadding, y);
  y += LAYOUT.SPACING.HEADING_UNDERLINE / 2; // Half of HEADING_UNDERLINE for medium spacing

  // Reset to normal font for content
  doc.setFont("helvetica", "normal");
  doc.setFontSize(LAYOUT.FONT.BODY);

  // Add education items
  if (educations && educations.length > 0) {
    y += LAYOUT.SPACING.SECTION_HEADER; // Space before first education

    educations.forEach((edu, index) => {
      // Left column: Date range and school
      doc.setFont("helvetica", "normal");
      doc.setFontSize(LAYOUT.FONT.SMALL);

      // Format date range
      const startDate = edu.startYear;
      const endDate = edu.ongoing
        ? "ongoing" in strings
          ? strings.ongoing
          : "Ongoing"
        : edu.endYear;
      const dateText = `${startDate} - ${endDate}`;

      doc.text(dateText, m.leftPadding, y, { maxWidth: leftColWidth });

      // School name with vertical spacing
      doc.setFont("helvetica", "bold");
      doc.setFontSize(LAYOUT.FONT.SUBTITLE);
      const schoolLines = doc.splitTextToSize(edu.school, leftColWidth);
      doc.text(schoolLines, m.leftPadding, y + LAYOUT.SPACING.SECTION_HEADER); // Using SECTION_HEADER for consistent large spacing

      // Right column: Degree and field of study
      doc.setFont("helvetica", "bold");
      doc.setFontSize(LAYOUT.FONT.SECTION_TITLE);
      doc.text(edu.degree, rightColX, y);

      // Field of study if available
      if (edu.fieldOfStudy) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(LAYOUT.FONT.BODY);
        doc.text(
          edu.fieldOfStudy,
          rightColX,
          y + LAYOUT.SPACING.HEADING_UNDERLINE / 2
        ); // Half of HEADING_UNDERLINE for medium spacing
      }

      // Description if available
      if (edu.description) {
        const descY =
          y +
          (edu.fieldOfStudy
            ? LAYOUT.SPACING.SECTION_HEADER
            : LAYOUT.SPACING.HEADING_UNDERLINE / 2);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(LAYOUT.FONT.BODY);
        const descLines = doc.splitTextToSize(edu.description, rightColWidth);
        doc.text(descLines, rightColX, descY);
        y += descLines.length * (LAYOUT.FONT.BODY + 2); // Line height
      } else {
        y += LAYOUT.SPACING.SECTION_HEADER; // Minimum height for an education item
      }

      // Add spacing between items, but not after the last one
      if (index < educations.length - 1) {
        y += LAYOUT.SPACING.SECTION_HEADER;
        doc.setDrawColor(220, 220, 220);
        const lineY = y - LAYOUT.SPACING.HEADING_UNDERLINE / 3; // Small offset for the line
        doc.line(m.leftPadding, lineY, m.pageW - m.rightPadding, lineY);
        y += LAYOUT.SPACING.HEADING_UNDERLINE; // Add some space after the line
      } else {
        y += LAYOUT.SPACING.SECTION_HEADER; // Add standard section header spacing
      }
    });
  }

  return y; // Return the new Y position
}

export default buildEducationSection;
