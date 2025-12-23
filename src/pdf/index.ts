import { newDoc, getMetrics, toBlob, downloadBlob, filenameFromUserName, ensureInterFonts, convertUrlToDataUrl } from './shared';
import { buildPersonalInfo } from './page1PersonalInfo/page1';
import { buildExperiencePage } from './page2Experience/page2';
import { buildEducationAndMorePage } from './page3EducationAndMore/page3';
import { buildCompetencesPage, type CompetenceCategory } from './page4Competences/page4';
import { getPdfStrings, type PdfLang, type TranslationStrings } from '../i18n';

export interface Experience {
  title: string;
  employer: string;
  description: string;
  startYear?: string;
  endYear?: string;
}

/** Create a CV PDF with multiple pages including experience section. */
export interface EducationItem {
  school: string;
  degree: string;
  fieldOfStudy?: string;
  startYear: string;
  endYear: string;
  ongoing?: boolean;
  description?: string;
}


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
  educations: EducationItem[] = [],
  courses: Array<{ name: string; issuer?: string; year?: string }> = [],
  competences: CompetenceCategory[] = [],
  engagementsPublications: Array<{
    type: 'engagement' | 'publication';
    title: string;
    year?: string;
    locationOrPublication?: string;
    description?: string;
    url?: string;
  }> = []
): Promise<Blob> {
  const doc = newDoc();
  const m = getMetrics();

  await ensureInterFonts();

  // Get translations for the specified language
  const strings = getPdfStrings(lang);

  // Convert photo URL to data URL if needed (for Firebase Storage URLs)
  let photoDataUrlConverted = photoDataUrl;
  if (photoDataUrl && !photoDataUrl.startsWith('data:')) {
    try {
      photoDataUrlConverted = await convertUrlToDataUrl(photoDataUrl);
    } catch (error) {
      console.error('[PDF] Failed to convert photo URL to data URL:', error);
      // Continue with undefined photo
      photoDataUrlConverted = undefined;
    }
  }

  // Build the first page with both columns
  await buildPersonalInfo(doc, m, {
    // Left column options
    photoDataUrl: photoDataUrlConverted,
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
    // Re-initialize metrics for the new page
    const m = getMetrics();
    await buildEducationAndMorePage(doc, m, { 
      lang,
      educations,
      courses: courses,
      engagementPublications: engagementsPublications
    });
    
    // Add competences page
    doc.addPage();
    const m2 = getMetrics();
    await buildCompetencesPage(doc, m2, { 
      lang,
      competences,
      strings: getPdfStrings(lang) as TranslationStrings
    });
  } else {
    // If no experiences, still add education page as second page
    doc.addPage();
    // Re-initialize metrics for the new page
    const m = getMetrics();
    await buildEducationAndMorePage(doc, m, { 
      lang,
      educations,
      courses: courses,
      engagementPublications: engagementsPublications
    });
    
    // Add competences page
    doc.addPage();
    const m2 = getMetrics();
    await buildCompetencesPage(doc, m2, { 
      lang,
      competences,
      strings: getPdfStrings(lang) as TranslationStrings
    });
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
  experiences: Experience[] = [],
  educations: EducationItem[] = [],
  courses: Array<{ name: string; issuer?: string; year?: string }> = [],
  competences: CompetenceCategory[] = [],
  engagementsPublications: Array<{
    type: 'engagement' | 'publication';
    title: string;
    year?: string;
    locationOrPublication?: string;
    description?: string;
    url?: string;
  }> = []
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
    experiences,
    educations,
    courses,
    competences,
    engagementsPublications
  );
  const filename = filenameFromUserName(ownerName);
  downloadBlob(blob, filename);
}

export { downloadBlob, filenameFromUserName } from './shared';
export type { PdfLang } from '../i18n';
