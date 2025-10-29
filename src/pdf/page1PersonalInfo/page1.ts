import jsPDF from 'jspdf';
import type { Metrics } from '../shared';
import { buildLeftColumn, type LeftColumnOptions } from './left';
import { buildRightColumn, type RightColumnOptions } from './right';
import type { ProjectItem } from './components/selectedProjects';
import type { PdfLang } from '../../i18n';

// Re-export all components and utilities
export * from './left';
export * from './right';
export * from './components/selectedProjects';

export interface Page1Options {
  // Left column options
  photoDataUrl?: string;
  roles?: string[];
  languages?: string[];
  expertise?: string[];
  leftColumn: LeftColumnOptions;
  
  // Right column options
  name?: string;
  description?: string;
  selectedProjects?: ProjectItem[];
  rightColumn: Omit<RightColumnOptions, 'cvTitle'> & { cvTitle?: string };
  
  // General options
  lang?: PdfLang;
}

/**
 * Build the first page of the CV with left and right columns
 */
export async function buildPersonalInfo(
  doc: jsPDF,
  m: Metrics,
  options: Page1Options
): Promise<void> {
  // Build left column
  await buildLeftColumn(
    doc,
    m,
    options.photoDataUrl,
    options.roles,
    options.languages,
    options.expertise,
    options.leftColumn
  );

  // Build right column
  await buildRightColumn(
    doc,
    m,
    options.name,
    options.description,
    options.selectedProjects,
    {
      cvTitle: options.rightColumn.cvTitle || '',
      selectedProjectsTitle: options.rightColumn.selectedProjectsTitle,
      summary: options.rightColumn.summary
    },
    options.lang
  );
}

export default buildPersonalInfo;
