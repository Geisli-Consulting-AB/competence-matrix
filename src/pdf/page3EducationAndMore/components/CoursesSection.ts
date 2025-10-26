import { jsPDF } from 'jspdf';
import type { Metrics } from '../../shared';
import type { Page3Options } from '../page3';
import { VERTICAL } from '../../constants';
import type { TranslationStrings } from '../../../i18n';

export interface CoursesSectionOptions extends Page3Options {
  strings?: TranslationStrings;
  // Add any specific options for courses section here
}

export async function buildCoursesSection(
  doc: jsPDF,
  m: Metrics,
  y: number,
  _options: CoursesSectionOptions = {}
): Promise<number> {
  // Set title styling
  doc.setFontSize(24);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  
  // Add title
  const title = _options.strings?.coursesAndCertifications || 'Courses & Certifications';
  doc.text(title, m.leftPadding, y);
  
  // Add a line under the title
  y += VERTICAL.XLARGE; // Space after title
  doc.setDrawColor(200, 200, 200);
  doc.line(m.leftPadding, y, m.pageW - m.rightPadding, y);
  y += VERTICAL.MEDIUM; // Space after line
  
  // Add courses content here
  // Update y as you add content
  
  return y + VERTICAL.XXLARGE; // Return the new Y position with some extra space after the section
}

export default buildCoursesSection;
