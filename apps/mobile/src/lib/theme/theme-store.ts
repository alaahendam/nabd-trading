import { THEME_STORAGE_KEY } from '../storage/keys';

export const THEME_PREFERENCES = ['light', 'dark', 'system'] as const;
export type ThemePreference = (typeof THEME_PREFERENCES)[number];
export type ResolvedTheme = 'light' | 'dark';

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

/** What the store needs from the device. The app passes the real ones; tests pass plain fakes. */
export interface ThemeEnvironment {
  storage: { getItem(key: string): string | null; setItem(key: string, value: string): void };
  /** Whether the device is in dark mode now. */
  systemPrefersDark(): boolean;
  /** Calls `listener` when the device switches between light and dark. Returns the way to stop. */
  subscribeSystem(listener: () => void): () => void;
}

/**
 * The theme: a preference (`light`, `dark` or `system`) and the theme that results from it. It
 * persists the preference and follows the device while the preference is `system`. The values
 * were read before the first render (see `StartupStorage`), so the first frame is already right.
 */
export class ThemeStore {
  private state: ThemeState;
  private readonly listeners = new Set<() => void>();
  private readonly stopSystem: () => void;

  constructor(private readonly environment: ThemeEnvironment) {
    this.state = this.compute(parseThemePreference(environment.storage.getItem(THEME_STORAGE_KEY)));
    this.stopSystem = environment.subscribeSystem(() => {
      this.update(this.state.preference);
    });
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
    this.environment.storage.setItem(THEME_STORAGE_KEY, preference);
    this.update(preference);
  }

  dispose(): void {
    this.stopSystem();
  }

  private compute(preference: ThemePreference): ThemeState {
    return { preference, resolved: resolveTheme(preference, this.environment.systemPrefersDark()) };
  }

  private update(preference: ThemePreference): void {
    const next = this.compute(preference);
    if (next.preference === this.state.preference && next.resolved === this.state.resolved) {
      return;
    }
    this.state = next;
    for (const listener of [...this.listeners]) {
      listener();
    }
  }
}
