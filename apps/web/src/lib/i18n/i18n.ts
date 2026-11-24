import i18next, { type i18n } from 'i18next';
import { initReactI18next } from 'react-i18next';

import { DEFAULT_LANGUAGE, type Language, LANGUAGES } from './language';
import { defaultNS, resources } from './resources';

/**
 * A ready i18next instance. Resources are bundled, so initialisation is synchronous (`t` works
 * right away). React escapes output already, so i18next does not.
 */
export function createI18n(language: Language): i18n {
  const instance = i18next.createInstance();
  void instance.use(initReactI18next).init({
    lng: language,
    fallbackLng: DEFAULT_LANGUAGE,
    supportedLngs: [...LANGUAGES],
    resources,
    defaultNS,
    interpolation: { escapeValue: false },
    initAsync: false,
  });
  return instance;
}
