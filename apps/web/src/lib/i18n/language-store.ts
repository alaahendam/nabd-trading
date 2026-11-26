import {
  applyDocumentLanguage,
  detectLanguage,
  type DocumentRootLike,
  type Language,
  LANGUAGE_STORAGE_KEY,
} from '@nabd/i18n';
import type { i18n } from 'i18next';

export interface LanguageState {
  readonly language: Language;
}

export interface LanguageEnvironment {
  storage: Pick<Storage, 'getItem' | 'setItem'>;
  browserLanguages: () => readonly string[];
  root: DocumentRootLike;
}

/** The real browser pieces. Storage is touched lazily because it can throw (private mode). */
export function browserLanguageEnvironment(): LanguageEnvironment {
  return {
    storage: {
      getItem: (key) => window.localStorage.getItem(key),
      setItem: (key, value) => {
        window.localStorage.setItem(key, value);
      },
    },
    browserLanguages: () => navigator.languages,
    root: document.documentElement,
  };
}

/**
 * The current language. Switching it changes i18next, persists the choice, and sets `lang` and
 * `dir` on the root element so the whole layout flips (the stylesheet uses logical properties).
 */
export class LanguageStore {
  private state: LanguageState;
  private readonly listeners = new Set<() => void>();

  constructor(
    private readonly i18n: i18n,
    private readonly environment: LanguageEnvironment,
  ) {
    this.state = { language: this.detect() };
    this.show(this.state.language);
  }

  getState(): LanguageState {
    return this.state;
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  setLanguage(language: Language): void {
    if (language === this.state.language) {
      return;
    }
    try {
      this.environment.storage.setItem(LANGUAGE_STORAGE_KEY, language);
    } catch {
      // The choice still applies for this session.
    }
    this.state = { language };
    this.show(language);
    for (const listener of [...this.listeners]) {
      listener();
    }
  }

  private detect(): Language {
    let stored: unknown;
    try {
      stored = this.environment.storage.getItem(LANGUAGE_STORAGE_KEY);
    } catch {
      stored = undefined;
    }
    return detectLanguage({ stored, browser: this.environment.browserLanguages() });
  }

  private show(language: Language): void {
    void this.i18n.changeLanguage(language);
    applyDocumentLanguage(this.environment.root, language);
  }
}
