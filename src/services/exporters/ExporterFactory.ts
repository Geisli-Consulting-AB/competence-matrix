import { DocumentFormat, type DocumentExporter } from './types';
import { PdfExporter } from './PdfExporter';
import { DocxExporter } from './DocxExporter';

/**
 * Factory class for creating document exporters
 * Implements the Factory Pattern to provide the appropriate exporter based on format
 */
export class ExporterFactory {
  /**
   * Create an exporter for the specified document format
   * @param format - The document format to export to
   * @returns A DocumentExporter instance for the specified format
   * @throws Error if the format is not supported
   */
  static createExporter(format: DocumentFormat): DocumentExporter {
    switch (format) {
      case DocumentFormat.PDF:
        return new PdfExporter();
      case DocumentFormat.DOCX:
        return new DocxExporter();
      default:
        throw new Error(`Unsupported document format: ${format}`);
    }
  }
}
