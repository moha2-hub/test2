import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpBackend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

import nextI18NextConfig from '../next-i18next.config.js';

export const createI18n = () => {
  if (!i18next.isInitialized) {
    i18next
      .use(HttpBackend)
      .use(LanguageDetector)
      .use(initReactI18next)
      .init({
        ...nextI18NextConfig.i18n,
        backend: {
          loadPath: '/locales/{{lng}}/{{ns}}.json',
        },
        detection: {
          order: ['cookie', 'localStorage', 'navigator', 'htmlTag'],
          caches: ['cookie', 'localStorage'],
        },
        react: { useSuspense: false },
      });
  }
  return i18next;
};
