import { generateCvPdf } from "../../pdf";
import type { DocumentExporter, ExportData } from "./types";

/**
 * PDF document exporter
 * Wraps the existing jsPDF-based CV generation
 */
export class PdfExporter implements DocumentExporter {
  async generate(data: ExportData): Promise<Blob> {
    const blob = await generateCvPdf(
      data.name,
      data.description,
      data.photoDataUrl,
      data.roles,
      data.languages,
      data.expertise,
      data.selectedProjects,
      data.lang,
      data.title,
      data.experiences,
      data.educations,
      data.courses,
      data.competences,
      data.engagementsPublications
    );

    return blob;
  }
}
