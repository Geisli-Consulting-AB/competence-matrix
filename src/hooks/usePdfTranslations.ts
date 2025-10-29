import { useCallback } from 'react';
import { getPdfStrings, type PdfLang } from '../i18n';

export const usePdfTranslations = (lang: PdfLang = 'en') => {
  const getTranslations = useCallback(() => {
    return getPdfStrings(lang);
  }, [lang]);

  return getTranslations();
};
