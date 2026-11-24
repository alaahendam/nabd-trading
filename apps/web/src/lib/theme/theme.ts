export const THEME_PREFERENCES = ['light', 'dark', 'system'] as const;
export type ThemePreference = (typeof THEME_PREFERENCES)[number];
export type ResolvedTheme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'nabd.theme';
const DARK_QUERY = '(prefers-color-scheme: dark)';

export function parseThemePreference(value: unknown): ThemePreference {
  return THEME_PREFERENCES.find((preference) => preference === value) ?? 'system';
}

export function resolveTheme(
  preference: ThemePreference,
  systemPrefersDark: boolean,
): ResolvedTheme {
  if (preference === 'system') {
    return systemPrefersDark ? 'dark' : 'light';
  }
  return preference;
}

export interface ThemeState {
  readonly preference: ThemePreference;
  readonly resolved: ResolvedTheme;
}

interface MediaQueryLike {
  readonly matches: boolean;
  addEventListener(type: 'change', listener: () => void): void;
  removeEventListener(type: 'change', listener: () => void): void;
}

export interface ThemeEnvironment {
  storage: Pick<Storage, 'getItem' | 'setItem'>;
  matchMedia: (query: string) => MediaQueryLike;
  root: { dataset: DOMStringMap };
}

/** The real browser pieces. Storage is touched lazily because it can throw (private mode). */
export function browserThemeEnvironment(): ThemeEnvironment {
  return {
    storage: {
      getItem: (key) => window.localStorage.getItem(key),
      setItem: (key, value) => {
        window.localStorage.setItem(key, value);
      },
    },
    matchMedia: (query) => window.matchMedia(query),
    root: document.documentElement,
  };
}

/**
 * The theme: a preference (`light`, `dark` or `system`) and the theme that results from it.
 * It writes `data-theme` on the root element, which the stylesheet reacts to, persists the
 * preference, and follows the operating system while the preference is `system`.
 *
 * The inline script in `index.html` does the same first step before the page paints, so keep
 * the two in step (a test runs the script against this logic).
 */
export class ThemeStore {
  private state: ThemeState;
  private readonly listeners = new Set<() => void>();
  private readonly query: MediaQueryLike;
  private readonly onSystemChange = () => {
    this.update(this.state.preference);
  };

  constructor(private readonly environment: ThemeEnvironment) {
    this.query = environment.matchMedia(DARK_QUERY);
    this.state = this.compute(this.readStoredPreference());
    this.apply();
    this.query.addEventListener('change', this.onSystemChange);
  }

  getState(): ThemeState {
    return this.state;
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  setPreference(preference: ThemePreference): void {
    if (preference === this.state.preference) {
      return;
    }
    try {
      this.environment.storage.setItem(THEME_STORAGE_KEY, preference);
    } catch {
      // The choice still applies for this session.
    }
    this.update(preference);
  }

  dispose(): void {
    this.query.removeEventListener('change', this.onSystemChange);
  }

  private readStoredPreference(): ThemePreference {
    try {
      return parseThemePreference(this.environment.storage.getItem(THEME_STORAGE_KEY));
    } catch {
      return 'system';
    }
  }

  private compute(preference: ThemePreference): ThemeState {
    return { preference, resolved: resolveTheme(preference, this.query.matches) };
  }

  private update(preference: ThemePreference): void {
    const next = this.compute(preference);
    if (next.preference === this.state.preference && next.resolved === this.state.resolved) {
      return;
    }
    this.state = next;
    this.apply();
    for (const listener of [...this.listeners]) {
      listener();
    }
  }

  private apply(): void {
    this.environment.root.dataset['theme'] = this.state.resolved;
  }
}
