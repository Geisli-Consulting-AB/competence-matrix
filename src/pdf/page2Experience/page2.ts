import jsPDF from 'jspdf';
import { getMetrics } from '../shared';
import type { PdfLang } from '../../i18n';
import { VERTICAL } from '../constants';

export async function buildExperiencePage(
  doc: jsPDF,
  lang: PdfLang = 'en',
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
  const leftColWidth = 200; // Very wide left column (dates and employer)
  const rightColX = m.leftPadding + leftColWidth + 20; // X position for right column with more spacing
  const rightColWidth = m.pageW - rightColX - m.rightPadding; // Width for right column
  
  // Use shared vertical spacing constants
  
  doc.addPage();
  
  // Initial Y position
  let y = 40;
  
  // Add Experience title
  doc.setFontSize(24);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  
  // Get translations
  const strings = await import('../../i18n').then(m => m.getPdfStrings(lang));
  const experienceTitle = strings.experience;
  
  doc.text(experienceTitle, m.leftPadding, y);
  y += VERTICAL.XLARGE; // Space after title
  
  // Add a line under the title
  doc.setDrawColor(200, 200, 200);
  doc.line(m.leftPadding, y, m.pageW - m.rightPadding, y);
  y += VERTICAL.MEDIUM; // Space after line
  
  // Add experiences if provided
  if (experiences && experiences.length > 0) {
    y += VERTICAL.XLARGE; // Space before first experience
    
    experiences.forEach((exp, index) => {
      // Left column: Dates and Employer
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      
      // Format date range
      const startDate = `${exp.startMonth} ${exp.startYear}`;
      const endDate = exp.ongoing ? 'Ongoing' : `${exp.endMonth} ${exp.endYear}`;
      const dateText = `${startDate} - ${endDate}`;
      doc.text(dateText, m.leftPadding, y, { maxWidth: leftColWidth });
      
      // Employer with vertical spacing
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      const employerLines = doc.splitTextToSize(exp.employer, leftColWidth);
      doc.text(employerLines, m.leftPadding, y + VERTICAL.LARGE);
      
      // Right column: Title, description, and competences
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text(exp.title, rightColX, y);
      
      // Description with vertical spacing
      doc.setFont('helvetica', 'normal');
      // Description
      doc.setFontSize(11);
      const descY = y + VERTICAL.LARGE;
      const descriptionLines = doc.splitTextToSize(exp.description, rightColWidth);
      doc.text(descriptionLines, rightColX, descY);
      y += descriptionLines.length * (11 + VERTICAL.SMALL) ;
      
      // Competences (only if competences exist)
      if (exp.competences && exp.competences.length > 0) {
        y += VERTICAL.MEDIUM; // Space before competences
        const competencesText = exp.competences.join(' • ');
        const competencesLines = doc.splitTextToSize(competencesText, rightColWidth);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'italic');
        doc.text(competencesLines, rightColX, y + VERTICAL.SMALL);
        y += competencesLines.length * (10 + VERTICAL.SMALL) + VERTICAL.XXLARGE;
      } else {
        // Add some spacing even without competences
        y += VERTICAL.MEDIUM + VERTICAL.XXLARGE;
      }
      
      // Add spacing between experiences, but not after the last one
      if (index < experiences.length - 1) {
        doc.setDrawColor(220, 220, 220);
        doc.line(m.leftPadding, y - VERTICAL.SMALL, m.pageW - m.rightPadding, y - VERTICAL.SMALL);
        y += VERTICAL.LARGE;
      }
    });
  }
}

export default buildExperiencePage;
