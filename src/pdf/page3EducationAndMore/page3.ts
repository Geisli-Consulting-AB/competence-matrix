import { jsPDF } from "jspdf";
import type { PdfLang, TranslationStrings } from "../../i18n";
import LAYOUT from "../constants/layout";
import { buildEducationSection } from "./components/EducationSection";
import { buildCoursesSection } from "./components/CoursesSection";
import { buildEngagementPublicationsSection } from "./components/EngagementPublicationsSection";
import type { Metrics } from "../shared";

export interface EducationItem {
  school: string;
  degree: string;
  fieldOfStudy?: string;
  startYear: string;
  endYear: string;
  ongoing?: boolean;
  description?: string;
}

export interface CourseItem {
  name: string;
  issuer?: string;
  year?: string;
  credentialId?: string;
}

export interface PublicationItem {
  title: string;
  publisher?: string;
  year?: string;
  description?: string;
  link?: string;
}

export interface EngagementPublicationItem {
  type: "engagement" | "publication";
  title: string;
  year?: string;
  locationOrPublication?: string;
  description?: string;
  url?: string;
}

export interface Page3Options {
  lang?: PdfLang;
  educations?: EducationItem[];
  courses?: CourseItem[];
  engagementPublications?: EngagementPublicationItem[];
  // Backward compatibility
  engagements?: Array<Omit<EngagementPublicationItem, "type">>;
  publications?: Array<Omit<EngagementPublicationItem, "type">>;
}

export async function buildEducationAndMorePage(
  doc: jsPDF,
  m: Metrics,
  options: Page3Options = { lang: "en" }
): Promise<void> {
  // Get translations with proper type
  const { getPdfStrings } = await import("../../i18n");
  const strings = getPdfStrings(
    options.lang || "en"
  ) as unknown as TranslationStrings;

  // Set initial Y position with proper top margin (convert mm to points)
  let y = LAYOUT.MARGIN.TOP * 1.5; // Start lower on the page

  // Set default font
  doc.setFont("helvetica", "normal");
  doc.setFontSize(LAYOUT.FONT.BODY);
  doc.setTextColor(0, 0, 0);

  // Debug: Draw a rectangle to show the page bounds
  // doc.setDrawColor(255, 0, 0);
  // doc.rect(0, 0, m.pageW, m.pageH);

  // Add education section if educations are provided
  if (options.educations && options.educations.length > 0) {
    y = await buildEducationSection(doc, m, y, {
      ...options,
      strings,
      educations: options.educations,
    });

    // Add extra space after the section if there's more content to come
    if (
      (options.courses && options.courses.length > 0) ||
      (options.engagements && options.engagements.length > 0) ||
      (options.publications && options.publications.length > 0)
    ) {
      y += LAYOUT.SPACING.SECTION_HEADER;
    }
  }

  // Add courses section if courses are provided

  if (options.courses && options.courses.length > 0) {
    y = await buildCoursesSection(doc, m, y, {
      ...options,
      strings,
      courses: options.courses,
    });

    // Add extra space after the section if there's more content to come
    if (
      (options.engagements && options.engagements.length > 0) ||
      (options.publications && options.publications.length > 0)
    ) {
      y += LAYOUT.SPACING.SECTION_HEADER;
    }
  }

  // Add engagement & publications section if data is provided
  const engagementPublications = [
    ...(options.engagementPublications || []),
    ...(options.engagements?.map((item) => ({
      ...item,
      type: "engagement" as const,
    })) || []),
    ...(options.publications?.map((item) => ({
      ...item,
      type: "publication" as const,
    })) || []),
  ];

  if (engagementPublications.length > 0) {
    // Add extra space before the section if it's not the first section
    if (y > LAYOUT.MARGIN.TOP * 1.5) {
      y += LAYOUT.SPACING.SECTION_HEADER;
    }

    // Update y with the new position after adding the section
    y = await buildEngagementPublicationsSection(doc, m, y, {
      ...options,
      strings,
      engagementPublications,
    });
  }
}

// Re-export individual section builders for convenience
export { default as buildEducationSection } from "./components/EducationSection";
export { default as buildCoursesSection } from "./components/CoursesSection";
export { default as buildEngagementPublicationsSection } from "./components/EngagementPublicationsSection";

export default buildEducationAndMorePage;
