import { jsPDF } from 'jspdf';
import type { Metrics } from '../shared';
import { VERTICAL } from '../constants';
import { buildEducationSection } from './components/EducationSection';
import { buildCoursesSection } from './components/CoursesSection';
import { buildEngagementPublicationsSection } from './components/EngagementPublicationsSection';
import type { PdfLang } from '../../i18n';

export interface Page3Options {
  lang?: PdfLang;
  // Add any page 3 specific options here
}

export async function buildEducationAndMorePage(
  doc: jsPDF,
  m: Metrics,
  options: Page3Options = { lang: 'en' }
): Promise<void> {
  // Initial Y position
  let y = 40;

  // Get translations and cast to the expected type
  const strings = await import('../../i18n').then(m => m.getPdfStrings(options.lang || 'en') as any);
  
  // Add education section
  y = await buildEducationSection(doc, m, y, { ...options, strings });
  
  // Add courses section
  y = await buildCoursesSection(doc, m, y, { ...options, strings });
  
  // Add engagement & publications section
  await buildEngagementPublicationsSection(doc, m, y, { ...options, strings });
}

// Re-export individual section builders for convenience
export { default as buildEducationSection } from './components/EducationSection';
export { default as buildCoursesSection } from './components/CoursesSection';
export { default as buildEngagementPublicationsSection } from './components/EngagementPublicationsSection';

export default buildEducationAndMorePage;
