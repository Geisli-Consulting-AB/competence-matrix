import jsPDF from 'jspdf';
import type { Metrics } from '../shared';
import { useFont } from '../shared';
import { addSelectedProjects } from './components/selectedProjects';
import type { ProjectItem } from './components/selectedProjects';
import type { PdfLang } from '../../../i18n';

function rightColumn(m: Metrics) {
  const x = m.leftColW + m.leftPadding;
  const width = m.pageW - x - m.rightPadding;
  return { x, width };
}

function setTextStyle(doc: jsPDF) {
  doc.setTextColor(0, 0, 0);
  useFont(doc, 'normal');
}

function addTitle(doc: jsPDF, text: string, x: number, y: number, maxWidth: number) {
  doc.setFontSize(24);
  doc.text(text, x, y, { maxWidth });
  return y + 28; // next baseline
}

function wrap(doc: jsPDF, text: string, maxWidth: number): string[] {
  return doc.splitTextToSize(text, maxWidth);
}

function addBodyFirstPage(
  doc: jsPDF,
  lines: string[],
  x: number,
  startY: number,
  bottomY: number,
  lineH = 16,
): { consumed: number; overflow: string } {
  doc.setFontSize(12);
  let y = startY;
  let i = 0;
  for (; i < lines.length; i++) {
    if (y > bottomY) break;
    doc.text(lines[i], x, y);
    y += lineH;
  }
  const overflow = i < lines.length ? lines.slice(i).join('\n') : '';
  return { consumed: i, overflow };
}

function addBodyNextPages(doc: jsPDF, text: string, m: Metrics, lineH = 16) {
  if (!text) return;
  const usableW = m.pageW - m.subsequentMarginL - m.subsequentMarginR;
  const pageLines = doc.splitTextToSize(text, usableW);
  let y = 60;
  for (let i = 0; i < pageLines.length; i++) {
    if (y > m.pageH - m.bottomMargin) {
      doc.addPage();
      y = 60;
    }
    doc.text(pageLines[i], m.subsequentMarginL, y);
    y += lineH;
  }
}

export interface RightColumnOptions {
  cvTitle: string;
  selectedProjectsTitle?: string;
  [key: string]: string | undefined; // Allow for additional optional string properties
}

// Build the right column of page 1 (title + description with wrapping and overflow handling)
export async function buildRightColumn(
  doc: jsPDF,
  m: Metrics,
  name: string | undefined,
  description: string | undefined,
  selectedProjects: ProjectItem[] | undefined,
  options: RightColumnOptions,
  lang: PdfLang = 'en'
) {
  setTextStyle(doc);
  const { x, width } = rightColumn(m);

  const title = (name?.trim() || '').slice(0, 200) || options.cvTitle;

  const titleTopY = 80;
  let y = addTitle(doc, title, x, titleTopY, width);

  // Add description if provided
  if (description) {
    const { x, width } = rightColumn(m);
    const bottomY = m.pageH - m.bottomMargin;
    
    const lines = wrap(doc, description, width);
    const { overflow } = addBodyFirstPage(doc, lines, x, y, bottomY);
    
    // Handle overflow on subsequent pages if needed
    if (overflow) {
      doc.addPage();
      addBodyNextPages(doc, overflow, m);
    }
  }

  // Add selected projects section if provided
  if (Array.isArray(selectedProjects) && selectedProjects.length > 0) {
    const { width } = rightColumn(m);
    const bottomY = m.pageH - m.bottomMargin;
    
    // Add some space before the projects section
    let projectsY = y + 200;
    
    // Add the projects section
    projectsY = addSelectedProjects(doc, m, projectsY, selectedProjects, width, lang);
    
    // If we're too close to the bottom, move to next page
    if (projectsY > bottomY - 100) { // Leave some margin for at least one project
      doc.addPage();
      projectsY = 60; // Start position on new page
      projectsY = addSelectedProjects(doc, m, projectsY, selectedProjects, width, lang);
    }
  }
}
