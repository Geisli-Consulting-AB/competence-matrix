import { jsPDF } from "jspdf";
import type { Metrics } from "../../shared";
import type { Page3Options } from "../page3";
import LAYOUT from "../../constants/layout";
import type { TranslationStrings } from "../../../i18n";

export interface EngagementItem {
  type: "engagement";
  title: string;
  year?: string;
  locationOrPublication?: string;
  description?: string;
  url?: string;
}

interface PublicationItem {
  type: "publication";
  title: string;
  year?: string;
  locationOrPublication?: string;
  description?: string;
  url?: string;
}

type EngagementPublicationItem = EngagementItem | PublicationItem;

export interface EngagementPublicationsSectionOptions extends Page3Options {
  strings?: TranslationStrings;
  engagementPublications?: EngagementPublicationItem[];
  // For backward compatibility
  engagements?: Array<Omit<EngagementItem, "type">>;
  publications?: Array<Omit<PublicationItem, "type">>;
}

const renderItem = (
  doc: jsPDF,
  m: Metrics,
  y: number,
  item: EngagementPublicationItem
): number => {
  const { title, year, locationOrPublication, description } = item;

  // Calculate column positions using the same layout as education section
  const leftColWidth = LAYOUT.LEFT_COLUMN * 3.78; // Convert mm to points (1mm = 3.78 points)
  const rightColX = m.leftPadding + leftColWidth + LAYOUT.GUTTER * 3.78;
  const rightColWidth = m.pageW - rightColX - m.rightPadding;

  // Left column: Year
  if (year) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(LAYOUT.FONT.SMALL);
    doc.text(year.toString(), m.leftPadding, y, { maxWidth: leftColWidth });
  }

  // Right column: Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(LAYOUT.FONT.SECTION_TITLE);
  doc.text(title, rightColX, y);

  // Location/Publication (right column)
  if (locationOrPublication) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(LAYOUT.FONT.BODY);
    // Add significant space between title and location/publication
    const locationY = y + LAYOUT.SPACING.SECTION_HEADER * 1.5;
    doc.text(locationOrPublication, rightColX, locationY);
    y = locationY + LAYOUT.SPACING.HEADING_UNDERLINE * 0.8; // Adjust the vertical position for the next element
  }

  // Description (right column)
  if (description) {
    const descY = y + LAYOUT.SPACING.SECTION_HEADER;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(LAYOUT.FONT.BODY);
    const lines = doc.splitTextToSize(description, rightColWidth);
    doc.text(lines, rightColX, descY);
    y = descY + lines.length * (LAYOUT.FONT.BODY + 2);
  } else {
    y += LAYOUT.SPACING.SECTION_HEADER;
  }

  return y;
};

export async function buildEngagementPublicationsSection(
  doc: jsPDF,
  m: Metrics,
  y: number,
  options: EngagementPublicationsSectionOptions = {}
): Promise<number> {
  // Combine all items from both sources
  const engagementPublications = [
    ...(options.engagementPublications || []),
    ...(options.engagements?.map((item) => ({
      ...item,
      type: "engagement" as const,
    })) || []),
    ...(options.publications?.map((item) => ({
      ...item,
      type: "publication" as const,
    })) || []),
  ];

  // Only proceed if there are items to display
  if (engagementPublications.length === 0) {
    return y;
  }

  // Group items by type
  const itemsByType = engagementPublications.reduce(
    (acc, item) => {
      if (!acc[item.type]) {
        acc[item.type] = [];
      }
      acc[item.type].push(item);
      return acc;
    },
    {} as Record<string, typeof engagementPublications>
  );

  // Section titles
  const engagementTitle = "Engagements";
  const publicationTitle = "Publications";

  // Define sections in order of appearance with their titles
  const sections = [
    { type: "engagement", label: engagementTitle },
    { type: "publication", label: publicationTitle },
  ];

  // Render each section
  for (const { type, label } of sections) {
    const items = itemsByType[type] || [];
    if (items.length === 0) continue;

    // Add section title with consistent spacing
    doc.setFontSize(LAYOUT.FONT.TITLE);
    doc.setFont("helvetica", "bold");
    doc.text(label, m.leftPadding, y);

    // Space after title, before line
    y += LAYOUT.SPACING.SECTION_HEADER;

    // Add a line under the title
    doc.setDrawColor(200, 200, 200);
    doc.line(m.leftPadding, y, m.pageW - m.rightPadding, y);

    // Space after line, before content
    y += LAYOUT.SPACING.HEADING_UNDERLINE / 2;

    // Reset to normal font for content
    doc.setFont("helvetica", "normal");
    doc.setFontSize(LAYOUT.FONT.BODY);

    // Additional space before first item
    y += LAYOUT.SPACING.SECTION_HEADER;

    // Render items
    for (let i = 0; i < items.length; i++) {
      y = renderItem(doc, m, y, items[i]);

      // Add spacing between items, but not after the last one
      if (i < items.length - 1) {
        y += LAYOUT.SPACING.SECTION_HEADER;
        doc.setDrawColor(220, 220, 220);
        const lineY = y - LAYOUT.SPACING.HEADING_UNDERLINE / 3;
        doc.line(m.leftPadding, lineY, m.pageW - m.rightPadding, lineY);
        y += LAYOUT.SPACING.HEADING_UNDERLINE;
      } else {
        y += LAYOUT.SPACING.SECTION_HEADER;
      }
    }
  }

  return y;
}

export default buildEngagementPublicationsSection;
