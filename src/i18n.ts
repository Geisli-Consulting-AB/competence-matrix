import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Define the translations as a const to infer the most specific type
const resources = {
  en: {
    translation: {
      contactTitle: 'Contact',
      rolesTitle: 'Roles',
      languagesTitle: 'Languages',
      expertiseTitle: 'Expertise',
      cvTitle: 'Curriculum Vitae',
      selectedProjectsTitle: 'Selected Projects',
      professionalSummary: 'Professional Summary',
      summary: 'Summary',
      experience: 'Experience',
      education: 'Education',
      coursesAndCertifications: 'Courses & Certifications',
      engagementAndPublications: 'Engagement & Publications',
    },
  },
  sv: {
    translation: {
      contactTitle: 'Kontakt',
      rolesTitle: 'Roller',
      languagesTitle: 'Språk',
      expertiseTitle: 'Expertkunskaper',
      cvTitle: 'Curriculum Vitae',
      selectedProjectsTitle: 'Utvalda projekt',
      professionalSummary: 'Sammanfattning',
      summary: 'Sammanfattning',
      experience: 'Erfarenheter',
      education: 'Utbildning',
      coursesAndCertifications: 'Kurser & Certifieringar',
      engagementAndPublications: 'Engagemang & Publikationer',
    },
  },
} as const;

// Infer the type from the resources object
export type TranslationResources = typeof resources;
export type TranslationStrings = TranslationResources['en']['translation'];
export type PdfLang = keyof TranslationResources;

// Initialize i18n
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already escapes values
    },
  });

// Helper function to get PDF strings without React hooks
export function getPdfStrings(lng: PdfLang = 'en') {
  return resources[lng].translation;
}

export default i18n;
