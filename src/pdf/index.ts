import { newDoc, getMetrics, toBlob, downloadBlob, filenameFromUserName } from './shared';
import { buildLeftColumn } from './page1/left';
import { buildRightColumn } from './page1/right';

/** Create a CV PDF (first page 40/60 split, title + description, optional photo in left column). */
export async function generateCvPdf(name?: string, description?: string, photoDataUrl?: string): Promise<Blob> {
  const doc = newDoc();
  const m = getMetrics();

  await buildLeftColumn(doc, m, photoDataUrl);
  buildRightColumn(doc, m, name, description);

  return toBlob(doc);
}

/** Generate and download the CV PDF in one call. */
export async function createAndDownloadCvPdf(ownerName?: string, ownerDescription?: string, photoDataUrl?: string) {
  const blob = await generateCvPdf(ownerName, ownerDescription, photoDataUrl);
  const filename = filenameFromUserName(ownerName);
  downloadBlob(blob, filename);
}

export { downloadBlob, filenameFromUserName } from './shared';
