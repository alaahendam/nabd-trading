import { DEFAULT_LANGUAGE, type Language, LANGUAGE_STORAGE_KEY, parseLanguage } from '@nabd/i18n';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { useStorage } from '../storage/storage-context';
import { deviceLayout } from './device-layout';
import { type LanguageSwitchResult, switchLanguage } from './switch-language';

/** The language in use, and the way to change it (see `switchLanguage`). */
export function useLanguageSwitch(): {
  current: Language;
  select: (next: Language) => Promise<LanguageSwitchResult>;
} {
  const { i18n } = useTranslation();
  const storage = useStorage();
  const current = parseLanguage(i18n.resolvedLanguage) ?? DEFAULT_LANGUAGE;

  const select = useCallback(
    (next: Language) =>
      switchLanguage(next, {
        current,
        storage,
        layout: deviceLayout,
        storageKey: LANGUAGE_STORAGE_KEY,
      }),
    [current, storage],
  );

  return { current, select };
}
