export const LANGUAGES = ['en', 'ar'] as const;
export type Language = (typeof LANGUAGES)[number];
export type Direction = 'ltr' | 'rtl';

export const DEFAULT_LANGUAGE: Language = 'en';
export const LANGUAGE_STORAGE_KEY = 'nabd.language';

/** Each language's name in that language. Never translated, so anyone can find their own. */
export const LANGUAGE_NAMES: Readonly<Record<Language, string>> = {
  en: 'English',
  ar: 'العربية',
};

const DIRECTIONS: Readonly<Record<Language, Direction>> = { en: 'ltr', ar: 'rtl' };

export function parseLanguage(value: unknown): Language | undefined {
  return LANGUAGES.find((language) => language === value);
}

/**
 * A valid stored choice wins, then the first browser language whose primary subtag is
 * supported (`ar-EG` is Arabic), then English. The inline script in `index.html` does the
 * same before first paint; a test runs it against this function.
 */
export function detectLanguage({
  stored,
  browser,
}: {
  stored: unknown;
  browser: readonly string[];
}): Language {
  const fromStorage = parseLanguage(stored);
  if (fromStorage) {
    return fromStorage;
  }
  for (const tag of browser) {
    const fromBrowser = parseLanguage(tag.toLowerCase().split('-')[0]);
    if (fromBrowser) {
      return fromBrowser;
    }
  }
  return DEFAULT_LANGUAGE;
}

export function directionOf(language: Language): Direction {
  return DIRECTIONS[language];
}

export interface DocumentRootLike {
  lang: string;
  dir: string;
}

export function applyDocumentLanguage(root: DocumentRootLike, language: Language): void {
  root.lang = language;
  root.dir = directionOf(language);
}
