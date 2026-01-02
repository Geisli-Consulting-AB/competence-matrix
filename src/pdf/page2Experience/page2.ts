import jsPDF from "jspdf";
import { getMetrics } from "../shared";
import type { PdfLang } from "../../i18n";
import LAYOUT from "../constants/layout";

export async function buildExperiencePage(
  doc: jsPDF,
  lang: PdfLang = "en",
  experiences?: Array<{
    title: string;
    employer: string;
    description: string;
    startYear?: string;
    startMonth?: string;
    endYear?: string;
    endMonth?: string;
    ongoing?: boolean;
    competences?: string[];
  }>
) {
  if (!experiences || experiences.length === 0) {
    return; // Don't add an empty experience page
  }

  const m = getMetrics();

  // Calculate column positions using shared constants
  const leftColWidth = LAYOUT.LEFT_COLUMN * 3.78; // Convert mm to points (1mm = 3.78 points)
  const rightColX = m.leftPadding + leftColWidth + LAYOUT.GUTTER * 3.78;
  const rightColWidth = m.pageW - rightColX - m.rightPadding;

  doc.addPage();

  // Initial Y position
  let y = LAYOUT.MARGIN.TOP;

  // Add Experience title
  doc.setFontSize(LAYOUT.FONT.TITLE);
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "bold");

  // Get translations
  const strings = await import("../../i18n").then((m) => m.getPdfStrings(lang));
  const experienceTitle = strings.experience;

  doc.text(experienceTitle, m.leftPadding, y);
  y += LAYOUT.SPACING.SECTION_HEADER; // Space after title

  // Add a line under the title
  doc.setDrawColor(200, 200, 200);
  doc.line(m.leftPadding, y, m.pageW - m.rightPadding, y);
  y += LAYOUT.SPACING.HEADING_UNDERLINE; // Space after line

  // Add experiences if provided
  if (experiences && experiences.length > 0) {
    y += LAYOUT.SPACING.SECTION_HEADER; // Space before first experience

    experiences.forEach((exp, index) => {
      // Left column: Dates and Employer
      // Left column: Date range and employer
      doc.setFont("helvetica", "normal");
      doc.setFontSize(LAYOUT.FONT.SMALL);

      // Format date range
      const startDate = exp.startMonth
        ? `${exp.startMonth} ${exp.startYear}`
        : exp.startYear;
      const endDate = exp.ongoing
        ? "ongoing" in strings
          ? strings.ongoing
          : "Ongoing"
        : exp.endMonth
          ? `${exp.endMonth} ${exp.endYear}`
          : exp.endYear;
      const dateText = `${startDate} - ${endDate}`;
      doc.text(dateText, m.leftPadding, y, { maxWidth: leftColWidth });

      // Employer with vertical spacing
      doc.setFont("helvetica", "bold");
      doc.setFontSize(LAYOUT.FONT.SUBTITLE);
      const employerLines = doc.splitTextToSize(exp.employer, leftColWidth);
      doc.text(
        employerLines,
        m.leftPadding,
        y + LAYOUT.SPACING.SECTION_HEADER * 0.8
      );

      // Right column: Title, description, and competences
      doc.setFont("helvetica", "bold");
      doc.setFontSize(LAYOUT.FONT.SECTION_TITLE);
      doc.text(exp.title, rightColX, y);

      // Description with vertical spacing
      doc.setFont("helvetica", "normal");
      doc.setFontSize(LAYOUT.FONT.BODY);
      const descY = y + LAYOUT.SPACING.SECTION_HEADER * 0.8;
      const descriptionLines = doc.splitTextToSize(
        exp.description,
        rightColWidth
      );
      doc.text(descriptionLines, rightColX, descY);
      y +=
        Math.max(
          descriptionLines.length * (LAYOUT.FONT.BODY + 2),
          employerLines.length * (LAYOUT.FONT.SUBTITLE + 2) +
            LAYOUT.SPACING.SECTION_HEADER * 0.8
        ) +
        LAYOUT.SPACING.HEADING_UNDERLINE / 2; // Line height

      // Competences (only if competences exist)
      if (exp.competences && exp.competences.length > 0) {
        y += LAYOUT.SPACING.HEADING_UNDERLINE; // Space before competences
        const competencesText = exp.competences.join(" • ");
        const competencesLines = doc.splitTextToSize(
          competencesText,
          rightColWidth
        );
        doc.setFontSize(LAYOUT.FONT.SMALL);
        doc.setFont("helvetica", "italic");
        doc.text(competencesLines, rightColX, y);
        y +=
          competencesLines.length * (LAYOUT.FONT.SMALL + 1) +
          LAYOUT.SPACING.LIST_ITEM / 2;
      } else {
        // Add some spacing even without competences
        y += LAYOUT.SPACING.LIST_ITEM / 2;
      }

      // Add spacing between experiences, but not after the last one
      if (index < experiences.length - 1) {
        doc.setDrawColor(220, 220, 220);
        const lineY = y + LAYOUT.SPACING.HEADING_UNDERLINE / 2;
        doc.line(m.leftPadding, lineY, m.pageW - m.rightPadding, lineY);
        y += LAYOUT.SPACING.LIST_ITEM; // Add extra space after each experience
      }
    });
  }
}

export default buildExperiencePage;
