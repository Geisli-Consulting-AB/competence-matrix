import { jsPDF } from 'jspdf';
import type { Metrics } from '../../shared';
import type { Page3Options } from '../page3';
import LAYOUT from '../../constants/layout';
import type { TranslationStrings } from '../../../i18n';

export interface EngagementPublicationsSectionOptions extends Page3Options {
  strings?: TranslationStrings;
  // Add any specific options for engagement & publications section here
}

export async function buildEngagementPublicationsSection(
  doc: jsPDF,
  m: Metrics,
  y: number,
  _options: EngagementPublicationsSectionOptions = {}
): Promise<number> {
  // Set title styling
  doc.setFontSize(24);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  
  // Add title
  const title = _options.strings?.engagementAndPublications || 'Engagement & Publications';
  doc.text(title, m.leftPadding, y);
  
  // Add a line under the title
  y += LAYOUT.SPACING.SECTION_HEADER; // Space after title
  doc.setDrawColor(200, 200, 200);
  doc.line(m.leftPadding, y, m.pageW - m.rightPadding, y);
  y += LAYOUT.SPACING.HEADING_UNDERLINE / 2; // Space after line
  
  // Add engagement & publications content here
  // Update y as you add content
  
  return y + LAYOUT.SPACING.LIST_ITEM; // Return the new Y position with some extra space after the section
}

export default buildEngagementPublicationsSection;
