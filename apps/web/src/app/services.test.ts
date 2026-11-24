import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createServices } from './services';

beforeEach(() => {
  vi.stubGlobal('matchMedia', () => ({
    matches: false,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  }));
});

afterEach(() => {
  vi.unstubAllGlobals();
  document.documentElement.removeAttribute('data-theme');
  document.documentElement.lang = 'en';
  document.documentElement.dir = 'ltr';
  localStorage.clear();
});

describe('createServices', () => {
  it('APP-16 builds every service against the browser without connecting', () => {
    const services = createServices('http://api.test');

    expect(services.i18n.language).toBe('en');
    expect(services.languageStore.getState().language).toBe('en');
    expect(services.themeStore.getState().preference).toBe('system');
    expect(document.documentElement.dataset['theme']).toBe('light');
    expect(services.queryClient.getQueryCache().getAll()).toEqual([]);
    expect(services.realtime.getStatus()).toBe('connecting');
    expect(typeof services.api.listStocks).toBe('function');
  });
});
