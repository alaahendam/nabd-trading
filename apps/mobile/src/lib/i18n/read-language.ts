import { DEFAULT_LANGUAGE, type Language, LANGUAGE_STORAGE_KEY, parseLanguage } from '@nabd/i18n';

/**
 * The saved language, or English. There is no device detection yet: Arabic text in a left-to-right
 * layout would be wrong, and the right-to-left layout comes with the language switch in M4.
 */
export function readLanguage(storage: { getItem(key: string): string | null }): Language {
  return parseLanguage(storage.getItem(LANGUAGE_STORAGE_KEY)) ?? DEFAULT_LANGUAGE;
}
