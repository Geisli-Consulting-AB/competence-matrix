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
): Promise<Blob> {
  console.group('[PDF] generateCvPdf');
  console.debug('[PDF] Inputs:', { hasName: !!name, name, hasDescription: !!description, hasPhoto: !!photoDataUrl, rolesCount: roles?.length ?? 0, expertiseCount: expertise?.length ?? 0, lang });
  const t0Label = '[PDF] total';
  console.time(t0Label);
  
  try {
    const doc = newDoc();
    const m = getMetrics();

    console.time('[PDF] ensureInterFonts');
    await ensureInterFonts(doc);
    console.timeEnd('[PDF] ensureInterFonts');

    // Get translations for the specified language
    const strings = getPdfStrings(lang);

    // Build left column with all required titles
    console.time('[PDF] buildLeftColumn');
    await buildLeftColumn(doc, m, photoDataUrl, roles, languages, expertise, {
      contactTitle: strings.contactTitle,
      rolesTitle: strings.rolesTitle,
      languagesTitle: strings.languagesTitle,
      expertiseTitle: strings.expertiseTitle,
      lang
    });
    console.timeEnd('[PDF] buildLeftColumn');

    // Build right column with all required options
    console.time('[PDF] buildRightColumn');
    await buildRightColumn(doc, m, name, description, selectedProjects, { 
      cvTitle: strings.cvTitle,
      selectedProjectsTitle: strings.selectedProjectsTitle
    }, lang);
    console.timeEnd('[PDF] buildRightColumn');

    const blob = toBlob(doc);
    console.timeEnd(t0Label);
    console.debug('[PDF] Blob size (approx bytes):', (blob as any).size ?? 'n/a');
    return blob;
  } catch (err) {
    console.timeEnd(t0Label);
    console.error('[PDF] Failed to generate PDF', err);
    throw err;
  } finally {
    console.groupEnd();
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
  lang: PdfLang = 'en'
) {
  const blob = await generateCvPdf(
    ownerName, 
    ownerDescription, 
    photoDataUrl, 
    roles, 
    languages, 
    expertise,
    selectedProjects,
    lang
  );
  const filename = filenameFromUserName(ownerName);
  downloadBlob(blob, filename);
}

export { downloadBlob, filenameFromUserName } from './shared';
