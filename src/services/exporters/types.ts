import type { PdfLang } from "../../i18n";

/**
 * Supported document export formats
 */
export const DocumentFormat = {
  PDF: "PDF",
  DOCX: "DOCX",
} as const;

export type DocumentFormat =
  (typeof DocumentFormat)[keyof typeof DocumentFormat];

/**
 * Experience data structure
 */
export interface ExperienceData {
  title: string;
  employer: string;
  description: string;
  startYear?: string;
  endYear?: string;
}

/**
 * Education data structure
 */
export interface EducationData {
  school: string;
  degree: string;
  fieldOfStudy?: string;
  startYear: string;
  endYear: string;
  ongoing?: boolean;
  description?: string;
}

/**
 * Course/Certification data structure
 */
export interface CourseData {
  name: string;
  issuer?: string;
  year?: string;
}

/**
 * Engagement/Publication data structure
 */
export interface EngagementPublicationData {
  type: "engagement" | "publication";
  title: string;
  year?: string;
  locationOrPublication?: string;
  description?: string;
  url?: string;
}

/**
 * Competence category data structure
 */
export interface CompetenceCategory {
  category: string;
  items: Array<{ name: string; level: number }>;
}

/**
 * Selected project data structure
 */
export interface SelectedProjectData {
  customer: string;
  title: string;
  description: string;
}

/**
 * Complete export data structure containing all CV information
 */
export interface ExportData {
  name?: string;
  description?: string;
  photoDataUrl?: string;
  roles?: string[];
  languages?: string[];
  expertise?: string[];
  selectedProjects?: SelectedProjectData[];
  lang: PdfLang;
  title?: string;
  experiences?: ExperienceData[];
  educations?: EducationData[];
  courses?: CourseData[];
  competences?: CompetenceCategory[];
  engagementsPublications?: EngagementPublicationData[];
}

/**
 * Abstract interface for document exporters
 * Implements the Strategy Pattern for different export formats
 */
export interface DocumentExporter {
  /**
   * Generate a document blob from the provided CV data
   * @param data - The complete CV data to export
   * @returns Promise resolving to a Blob containing the exported document
   */
  generate(data: ExportData): Promise<Blob>;
}
