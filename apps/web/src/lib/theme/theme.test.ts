import { runInNewContext } from 'node:vm';

import { afterEach, describe, expect, it, vi } from 'vitest';

import indexHtml from '../../../index.html?raw';
import {
  browserThemeEnvironment,
  parseThemePreference,
  resolveTheme,
  THEME_PREFERENCES,
  THEME_STORAGE_KEY,
  ThemeStore,
} from './theme';

/** A fake `matchMedia('(prefers-color-scheme: dark)')` the test can flip. */
const makeMedia = (initiallyDark: boolean) => {
  const listeners = new Set<() => void>();
  const media = {
    matches: initiallyDark,
    addEventListener: (_type: 'change', listener: () => void) => listeners.add(listener),
    removeEventListener: (_type: 'change', listener: () => void) => listeners.delete(listener),
  };
  const flip = (dark: boolean) => {
    media.matches = dark;
    for (const listener of [...listeners]) {
      listener();
    }
  };
  return { media, flip, listenerCount: () => listeners.size };
};

const makeStorage = (initial?: string) => {
  const data = new Map<string, string>(initial === undefined ? [] : [[THEME_STORAGE_KEY, initial]]);
  return {
    data,
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => {
      data.set(key, value);
    },
  };
};

const setup = ({ stored, dark = false }: { stored?: string; dark?: boolean } = {}) => {
  const storage = makeStorage(stored);
  const { media, flip, listenerCount } = makeMedia(dark);
  const root = { dataset: {} as DOMStringMap };
  const store = new ThemeStore({ storage, matchMedia: () => media, root });
  return { store, storage, root, flip, listenerCount };
};

describe('parseThemePreference', () => {
  it.each(THEME_PREFERENCES)('THM-01 keeps %s', (value) => {
    expect(parseThemePreference(value)).toBe(value);
  });

  it.each(['', 'blue', null, undefined, 5])('THM-01 turns %j into system', (value) => {
    expect(parseThemePreference(value)).toBe('system');
  });
});

describe('resolveTheme', () => {
  it('THM-02 follows the OS only for system', () => {
    expect(resolveTheme('system', true)).toBe('dark');
    expect(resolveTheme('system', false)).toBe('light');
    expect(resolveTheme('light', true)).toBe('light');
    expect(resolveTheme('dark', false)).toBe('dark');
  });
});

describe('ThemeStore', () => {
  it('THM-03 starts from the stored preference and applies it', () => {
    const dark = setup({ stored: 'dark' });
    expect(dark.store.getState()).toEqual({ preference: 'dark', resolved: 'dark' });
    expect(dark.root.dataset['theme']).toBe('dark');

    const garbage = setup({ stored: 'blue', dark: true });
    expect(garbage.store.getState()).toEqual({ preference: 'system', resolved: 'dark' });

    const nothing = setup();
    expect(nothing.store.getState()).toEqual({ preference: 'system', resolved: 'light' });
    expect(nothing.root.dataset['theme']).toBe('light');
  });

  it('THM-04 persists, applies and notifies on a change, and ignores a repeat', () => {
    const { store, storage, root } = setup();
    const listener = vi.fn();
    store.subscribe(listener);

    store.setPreference('dark');
    expect(store.getState()).toEqual({ preference: 'dark', resolved: 'dark' });
    expect(storage.data.get(THEME_STORAGE_KEY)).toBe('dark');
    expect(root.dataset['theme']).toBe('dark');
    expect(listener).toHaveBeenCalledTimes(1);

    store.setPreference('dark');
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('THM-05 follows the OS live, but only while the preference is system', () => {
    const { store, flip, root } = setup({ dark: false });
    const listener = vi.fn();
    store.subscribe(listener);

    flip(true);
    expect(store.getState().resolved).toBe('dark');
    expect(root.dataset['theme']).toBe('dark');
    expect(listener).toHaveBeenCalledTimes(1);

    store.setPreference('light');
    expect(store.getState().resolved).toBe('light');
    listener.mockClear();

    flip(false);
    flip(true);
    expect(store.getState()).toEqual({ preference: 'light', resolved: 'light' });
    expect(listener).not.toHaveBeenCalled();

    store.setPreference('system');
    expect(store.getState()).toEqual({ preference: 'system', resolved: 'dark' });
  });

  it('THM-06 tolerates storage that throws', () => {
    const failing = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
    };
    const { media } = makeMedia(false);
    const root = { dataset: {} as DOMStringMap };
    const store = new ThemeStore({ storage: failing, matchMedia: () => media, root });

    expect(store.getState().preference).toBe('system');
    store.setPreference('dark');
    expect(store.getState()).toEqual({ preference: 'dark', resolved: 'dark' });
    expect(root.dataset['theme']).toBe('dark');
  });

  it('THM-07 stops listening after dispose', () => {
    const { store, flip, listenerCount } = setup({ dark: false });
    const listener = vi.fn();
    store.subscribe(listener);
    expect(listenerCount()).toBe(1);

    store.dispose();
    expect(listenerCount()).toBe(0);
    flip(true);
    expect(store.getState().resolved).toBe('light');
    expect(listener).not.toHaveBeenCalled();
  });

  it('THM-08 returns a stable state until something changes', () => {
    const { store, flip } = setup();
    const first = store.getState();
    expect(store.getState()).toBe(first);

    flip(true);
    expect(store.getState()).not.toBe(first);

    const second = store.getState();
    store.setPreference('system');
    expect(store.getState()).toBe(second);
  });

  it('THM-04 stops notifying a listener that unsubscribed', () => {
    const { store } = setup();
    const listener = vi.fn();
    const stop = store.subscribe(listener);
    stop();
    store.setPreference('dark');
    expect(listener).not.toHaveBeenCalled();
  });
});

describe('browserThemeEnvironment', () => {
  afterEach(() => {
    localStorage.clear();
    delete document.documentElement.dataset['theme'];
    vi.unstubAllGlobals();
  });

  it('THM-09 wires localStorage, matchMedia and the root element', () => {
    const { media } = makeMedia(true);
    const matchMedia = vi.fn(() => media);
    vi.stubGlobal('matchMedia', matchMedia);
    localStorage.setItem(THEME_STORAGE_KEY, 'light');

    const environment = browserThemeEnvironment();
    expect(environment.storage.getItem(THEME_STORAGE_KEY)).toBe('light');
    environment.storage.setItem(THEME_STORAGE_KEY, 'dark');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
    expect(environment.matchMedia('(prefers-color-scheme: dark)')).toBe(media);
    expect(matchMedia).toHaveBeenCalledWith('(prefers-color-scheme: dark)');
    expect(environment.root).toBe(document.documentElement);
  });
});

describe('the pre-paint script in index.html', () => {
  const script = /<script>([\s\S]*?)<\/script>/.exec(indexHtml)?.[1] ?? '';

  /** Runs the script in an isolated context with a fake browser, and returns `data-theme`. */
  const run = ({
    stored,
    dark,
    storageThrows = false,
  }: {
    stored?: string;
    dark: boolean;
    storageThrows?: boolean;
  }) => {
    const dataset: Record<string, string> = {};
    runInNewContext(script, {
      localStorage: {
        getItem: () => {
          if (storageThrows) {
            throw new Error('blocked');
          }
          return stored ?? null;
        },
      },
      matchMedia: () => ({ matches: dark }),
      document: { documentElement: { dataset } },
    });
    return dataset['theme'];
  };

  it('THM-10 finds the script', () => {
    expect(script).toContain(THEME_STORAGE_KEY);
  });

  it.each([
    ['stored dark', { stored: 'dark', dark: false }, 'dark'],
    ['stored light with a dark OS', { stored: 'light', dark: true }, 'light'],
    ['nothing stored, dark OS', { dark: true }, 'dark'],
    ['nothing stored, light OS', { dark: false }, 'light'],
    ['stored garbage, dark OS', { stored: 'blue', dark: true }, 'dark'],
    ['stored system, light OS', { stored: 'system', dark: false }, 'light'],
    ['storage throwing, dark OS', { dark: true, storageThrows: true }, 'dark'],
  ] as const)('THM-10 matches the store logic: %s', (_label, input, expected) => {
    const stored = 'stored' in input ? input.stored : undefined;
    expect(resolveTheme(parseThemePreference(stored), input.dark)).toBe(expected);
    expect(run(input)).toBe(expected);
  });
});
