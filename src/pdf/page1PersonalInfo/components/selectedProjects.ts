import jsPDF from 'jspdf';
import type { Metrics } from '../../shared';
import { setFontStyle } from '../../shared';
import { SPACING } from '../constants';
import { getPdfStrings } from '../../../i18n';
import type { PdfLang } from '../../../i18n';

export interface ProjectItem {
  customer: string;
  title: string;
  description: string;
}

// Add selected projects section beneath the given startY; returns next baseline Y
export function addSelectedProjects(
  doc: jsPDF,
  m: Metrics,
  startY: number,
  projects: ProjectItem[],
  maxWidth: number,
  lang: PdfLang = 'en'
): number {
  if (!Array.isArray(projects) || projects.length === 0) {
    return startY;
  }

  let y = startY;
  
  // Section title
  doc.setTextColor(0, 0, 0);
  setFontStyle(doc, 'bold');
  doc.setFontSize(16);
  const t = getPdfStrings(lang);
  doc.text(t.selectedProjectsTitle, m.leftColW + m.leftPadding, y);
  y += 8; // Space after title

  // Underline
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  doc.line(m.leftColW + m.leftPadding, y, m.pageW - m.rightPadding, y);
  y += SPACING.SECTION_HEADER;

  // Projects list
  setFontStyle(doc, 'normal');
  
  for (const project of projects) {
    if (!project) continue;
    
    // Customer
    doc.setFontSize(10);
    doc.setTextColor(16, 27, 41); // #101b29
    doc.text(project.customer || '', m.leftColW + m.leftPadding, y, { maxWidth });
    y += 16; 
    
    // Project title
    doc.setFontSize(12);
    setFontStyle(doc, 'bold');
    doc.text(project.title || '', m.leftColW + m.leftPadding, y, { maxWidth });
    y += SPACING.LIST_ITEM -10; 
    
    // Project description
    setFontStyle(doc, 'normal');
    doc.setFontSize(10);
    const lines = doc.splitTextToSize(project.description || '', maxWidth);
    doc.text(lines, m.leftColW + m.leftPadding, y, { maxWidth });
    y += (lines.length * 12) + SPACING.LIST_ITEM; // 12pt line height for description
  }

  return y;
}
