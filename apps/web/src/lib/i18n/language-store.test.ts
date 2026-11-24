import { afterEach, describe, expect, it, vi } from 'vitest';

import { createI18n } from './i18n';
import { LANGUAGE_STORAGE_KEY } from './language';
import { browserLanguageEnvironment, LanguageStore } from './language-store';

const makeStorage = (initial?: string) => {
  const data = new Map<string, string>(
    initial === undefined ? [] : [[LANGUAGE_STORAGE_KEY, initial]],
  );
  return {
    data,
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => {
      data.set(key, value);
    },
  };
};

const setup = ({ stored, browser = [] }: { stored?: string; browser?: string[] } = {}) => {
  const i18n = createI18n('en');
  const storage = makeStorage(stored);
  const root = { lang: '', dir: '' };
  const store = new LanguageStore(i18n, { storage, browserLanguages: () => browser, root });
  return { i18n, storage, root, store };
};

describe('LanguageStore', () => {
  it('LNG-05 starts from what was stored, else the browser, else English', () => {
    const stored = setup({ stored: 'ar' });
    expect(stored.store.getState()).toEqual({ language: 'ar' });
    expect(stored.i18n.language).toBe('ar');
    expect(stored.root).toEqual({ lang: 'ar', dir: 'rtl' });

    const browser = setup({ browser: ['fr', 'ar-EG'] });
    expect(browser.store.getState().language).toBe('ar');
    expect(browser.root.dir).toBe('rtl');

    const nothing = setup();
    expect(nothing.store.getState().language).toBe('en');
    expect(nothing.i18n.language).toBe('en');
    expect(nothing.root).toEqual({ lang: 'en', dir: 'ltr' });
  });

  it('LNG-06 switches i18next, persists, updates the document and notifies once', () => {
    const { store, i18n, storage, root } = setup();
    const listener = vi.fn();
    store.subscribe(listener);

    store.setLanguage('ar');
    expect(store.getState()).toEqual({ language: 'ar' });
    expect(i18n.language).toBe('ar');
    expect(i18n.t('nav.stocks')).not.toBe('Stocks');
    expect(storage.data.get(LANGUAGE_STORAGE_KEY)).toBe('ar');
    expect(root).toEqual({ lang: 'ar', dir: 'rtl' });
    expect(listener).toHaveBeenCalledTimes(1);

    store.setLanguage('ar');
    expect(listener).toHaveBeenCalledTimes(1);

    store.setLanguage('en');
    expect(root).toEqual({ lang: 'en', dir: 'ltr' });
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('LNG-07 tolerates storage that throws', () => {
    const failing = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
    };
    const i18n = createI18n('en');
    const root = { lang: '', dir: '' };
    const store = new LanguageStore(i18n, {
      storage: failing,
      browserLanguages: () => ['ar'],
      root,
    });
    expect(store.getState().language).toBe('ar');

    store.setLanguage('en');
    expect(store.getState().language).toBe('en');
    expect(root.lang).toBe('en');
  });

  it('LNG-08 returns a stable state and stops notifying after unsubscribe', () => {
    const { store } = setup();
    const first = store.getState();
    expect(store.getState()).toBe(first);

    const listener = vi.fn();
    const stop = store.subscribe(listener);
    stop();
    store.setLanguage('ar');
    expect(listener).not.toHaveBeenCalled();
    expect(store.getState()).not.toBe(first);
  });
});

describe('browserLanguageEnvironment', () => {
  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('LNG-10 wires localStorage, navigator.languages and the root element', () => {
    vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['ar-EG', 'en']);
    localStorage.setItem(LANGUAGE_STORAGE_KEY, 'en');

    const environment = browserLanguageEnvironment();
    expect(environment.storage.getItem(LANGUAGE_STORAGE_KEY)).toBe('en');
    environment.storage.setItem(LANGUAGE_STORAGE_KEY, 'ar');
    expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('ar');
    expect(environment.browserLanguages()).toEqual(['ar-EG', 'en']);
    expect(environment.root).toBe(document.documentElement);
  });
});
