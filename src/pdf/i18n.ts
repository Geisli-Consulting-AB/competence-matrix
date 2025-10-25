export type PdfLang = 'en' | 'sv';

export type PdfStrings = {
  contactTitle: string; // left column heading for contact
  rolesTitle: string;   // left column heading for roles
  cvTitle: string;      // default document title when name missing
};

const STRINGS: Record<PdfLang, PdfStrings> = {
  en: {
    contactTitle: 'Contact',
    rolesTitle: 'Roles',
    cvTitle: 'Curriculum Vitae',
  },
  sv: {
    contactTitle: 'Kontakt',
    rolesTitle: 'Roller',
    cvTitle: 'Curriculum Vitae',
  },
};

export function getPdfStrings(lang: PdfLang = 'en'): PdfStrings {
  return STRINGS[lang] || STRINGS.en;
}
