import jsPDF from "jspdf";
import type { Metrics } from "../shared";
import { addContact } from "./components/contact";
import { addRoles } from "./components/roles";
import { addLanguages } from "./components/languages";
import { addExpertise } from "./components/expertise";
import { addAvatar } from "./components/avatar";
import { LAYOUT } from "../constants/layout";

// Left column background: #101b29
export function drawSidebar(doc: jsPDF, m: Metrics) {
  doc.setFillColor(16, 27, 41);
  doc.rect(0, 0, m.leftColW, m.pageH, "F");
}

import type { PdfLang } from "../../i18n";

export interface LeftColumnOptions {
  contactTitle: string;
  rolesTitle: string;
  languagesTitle: string;
  expertiseTitle: string;
  lang: PdfLang;
  [key: string]: string | PdfLang; // Allow for additional string properties
}

// Build the left column of page 1
export async function buildLeftColumn(
  doc: jsPDF,
  m: Metrics,
  photoDataUrl: string | undefined,
  roles: string[] | undefined,
  languages: string[] | undefined,
  expertise: string[] | undefined,
  options: LeftColumnOptions
) {
  drawSidebar(doc, m);
  const startY = await addAvatar(doc, m, photoDataUrl);
  const afterAvatarY = startY + LAYOUT.SPACING.SECTION_BOTTOM_MARGIN;
  let y = await addContact(doc, m, afterAvatarY, options.lang);

  // Add roles section if there are any roles
  if (Array.isArray(roles) && roles.length > 0) {
    y = await addRoles(doc, m, y, roles, options.lang);
    y += LAYOUT.SPACING.SECTION_BOTTOM_MARGIN;
  }

  // Add expertise section if there are any expertise items
  if (Array.isArray(expertise) && expertise.length > 0) {
    y = await addExpertise(doc, m, y, expertise, options.lang);
    y += LAYOUT.SPACING.SECTION_BOTTOM_MARGIN;
  }

  // Add languages section if there are any languages
  if (Array.isArray(languages) && languages.length > 0) {
    await addLanguages(doc, m, y, languages, options.lang);
    // No need to add bottom margin after the last section
  }
}

// Re-export section builders for discoverability
export { addContact } from "./components/contact";
export { addRoles } from "./components/roles";
export { addLanguages } from "./components/languages";
export { addExpertise } from "./components/expertise";
export { addAvatar } from "./components/avatar";
