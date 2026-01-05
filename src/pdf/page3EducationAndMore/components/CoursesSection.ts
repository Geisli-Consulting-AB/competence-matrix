import { jsPDF } from "jspdf";
import type { Metrics } from "../../shared";
import type { Page3Options, CourseItem } from "../page3";
import type { TranslationStrings } from "../../../i18n";
import LAYOUT from "../../constants/layout";

export interface CoursesSectionOptions extends Page3Options {
  strings?: TranslationStrings;
  courses?: CourseItem[];
}

export async function buildCoursesSection(
  doc: jsPDF,
  m: Metrics,
  y: number,
  options: CoursesSectionOptions = {}
): Promise<number> {
  const { strings = {} as TranslationStrings, courses = [] } = options;

  const title = strings.coursesAndCertifications || "Courses & Certifications";

  // Calculate column positions using the same layout as education section
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
  y += LAYOUT.SPACING.HEADING_UNDERLINE; // Full HEADING_UNDERLINE for better spacing

  // Reset to normal font for content
  doc.setFont("helvetica", "normal");
  doc.setFontSize(LAYOUT.FONT.BODY);

  // Add courses
  if (courses && courses.length > 0) {
    const initialY = y + LAYOUT.SPACING.SECTION_HEADER * 0.8; // Slightly reduced initial spacing
    y = initialY;

    courses.forEach((course, index) => {
      if (index > 0) {
        // Add spacing between course items, but less than a full SECTION_HEADER
        y += LAYOUT.SPACING.HEADING_UNDERLINE * 0.6;
      }

      // Left column: Year and organization
      doc.setFont("helvetica", "normal");
      doc.setFontSize(LAYOUT.FONT.SMALL);

      // Year (ensure it's a string)
      const yearText = course.year?.toString() || "";
      doc.text(yearText, m.leftPadding, y, { maxWidth: leftColWidth });

      // Organization/Issuer
      doc.setFont("helvetica", "bold");
      doc.setFontSize(LAYOUT.FONT.SUBTITLE);
      const issuer = course.issuer || "";
      const orgLines = doc.splitTextToSize(issuer, leftColWidth);
      const orgY = y + LAYOUT.SPACING.SECTION_HEADER * 0.7; // Reduced spacing
      doc.text(orgLines, m.leftPadding, orgY);

      // Right column: Course name
      doc.setFont("helvetica", "bold");
      doc.setFontSize(LAYOUT.FONT.SECTION_TITLE);
      const titleLines = doc.splitTextToSize(course.name, rightColWidth);
      doc.text(titleLines, rightColX, y);

      // Calculate heights for both columns
      const titleHeight = titleLines.length * (LAYOUT.FONT.SECTION_TITLE + 2);
      const orgHeight = orgLines.length * (LAYOUT.FONT.SUBTITLE + 2);

      // Use the maximum height of both columns plus some spacing
      const itemHeight =
        Math.max(titleHeight, orgHeight + LAYOUT.SPACING.SECTION_HEADER * 0.7) +
        LAYOUT.SPACING.HEADING_UNDERLINE * 0.6;

      // Add a subtle separator between items (except after the last one)
      if (index < courses.length - 1) {
        const lineY = y + itemHeight - LAYOUT.SPACING.HEADING_UNDERLINE * 0.3;
        doc.setDrawColor(240, 240, 240);
        doc.line(m.leftPadding, lineY, m.pageW - m.rightPadding, lineY);
      }

      y += itemHeight;
    });
  }

  // Add some space after the last item
  return y + LAYOUT.SPACING.LIST_ITEM / 2;
}

export default buildCoursesSection;
