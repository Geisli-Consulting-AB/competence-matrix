import { newDoc, getMetrics, toBlob, downloadBlob, filenameFromUserName, ensureInterFonts } from './shared';
import { buildPersonalInfo } from './page1PersonalInfo/page1';
import { buildExperiencePage } from './page2Experience/page2';
import { buildEducationAndMorePage } from './page3EducationAndMore/page3';
import { getPdfStrings, type PdfLang } from '../i18n';

export interface Experience {
  title: string;
  employer: string;
  description: string;
  startYear?: string;
  endYear?: string;
}

/** Create a CV PDF with multiple pages including experience section. */
export async function generateCvPdf(
  name?: string,
  description?: string,
  photoDataUrl?: string,
  roles?: string[],
  languages?: string[],
  expertise?: string[],
  selectedProjects?: Array<{ customer: string; title: string; description: string }>,
  lang: PdfLang = 'en',
  title?: string,
  experiences: Experience[] = [],
): Promise<Blob> {
  const doc = newDoc();
  const m = getMetrics();

  await ensureInterFonts();

  // Get translations for the specified language
  const strings = getPdfStrings(lang);

  // Build the first page with both columns
  await buildPersonalInfo(doc, m, {
    // Left column options
    photoDataUrl,
    roles,
    languages,
    expertise,
    leftColumn: {
      contactTitle: strings.contactTitle,
      rolesTitle: strings.rolesTitle,
      languagesTitle: strings.languagesTitle,
      expertiseTitle: strings.expertiseTitle,
      lang
    },
    
    // Right column options
    name,
    description,
    selectedProjects,
    rightColumn: {
      cvTitle: title || strings.cvTitle,
      selectedProjectsTitle: strings.selectedProjectsTitle,
      summary: strings.summary
    },
    
    // General options
    lang
  });

  // Add experience page if there are experiences
  if (experiences && experiences.length > 0) {
    await buildExperiencePage(doc, lang, experiences);
    
    // Add a new page for education and more
    doc.addPage();
    await buildEducationAndMorePage(doc, m, { lang });
  } else {
    // If no experiences, still add education page as second page
    doc.addPage();
    await buildEducationAndMorePage(doc, m, { lang });
  }

  return toBlob(doc);
}

/** Generate and download the CV PDF in one call. */
export async function createAndDownloadCvPdf(
  ownerName?: string,
  ownerDescription?: string,
  photoDataUrl?: string,
  roles?: string[],
  languages?: string[],
  expertise?: string[],
  selectedProjects?: Array<{ customer: string; title: string; description: string }>,
  lang: PdfLang = 'en',
  title?: string,
  experiences: Experience[] = []
) {
  const blob = await generateCvPdf(
    ownerName, 
    ownerDescription, 
    photoDataUrl, 
    roles, 
    languages, 
    expertise,
    selectedProjects,
    lang,
    title,
    experiences
  );
  const filename = filenameFromUserName(ownerName);
  downloadBlob(blob, filename);
}

export { downloadBlob, filenameFromUserName } from './shared';
export type { PdfLang } from '../i18n';
