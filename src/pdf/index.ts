import { newDoc, getMetrics, toBlob, downloadBlob, filenameFromUserName, ensureInterFonts } from './shared';
import { buildLeftColumn } from './page1/left';
import { buildRightColumn } from './page1/right';
import { getPdfStrings, type PdfLang } from '../i18n';

/** Create a CV PDF (first page 40/60 split, title + description, optional photo in left column). */
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
): Promise<Blob> {
  try {
    const doc = newDoc();
    const m = getMetrics();

    await ensureInterFonts(doc);

    // Get translations for the specified language
    const strings = getPdfStrings(lang);

    // Build left column with all required titles
    await buildLeftColumn(doc, m, photoDataUrl, roles, languages, expertise, {
      contactTitle: strings.contactTitle,
      rolesTitle: strings.rolesTitle,
      languagesTitle: strings.languagesTitle,
      expertiseTitle: strings.expertiseTitle,
      lang
    });

    // Build right column with all required options
    await buildRightColumn(doc, m, name, description, selectedProjects, { 
      cvTitle: title || strings.cvTitle, // Use the provided title or fall back to default
      selectedProjectsTitle: strings.selectedProjectsTitle,
      summary: strings.summary // Add translated summary heading
    }, lang);

    const blob = toBlob(doc);
    return blob;
  } catch (err) {
    throw err;
  }
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
  title?: string
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
    title
  );
  const filename = filenameFromUserName(ownerName);
  downloadBlob(blob, filename);
}

export { downloadBlob, filenameFromUserName } from './shared';
export type { PdfLang } from '../i18n';
