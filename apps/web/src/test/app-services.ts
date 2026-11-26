import { createApi } from '@nabd/api-client';
import { createHttpClient } from '@nabd/api-client';
import { createQueryClient } from '@nabd/data';
import type { Language } from '@nabd/i18n';
import { createI18n } from '@nabd/i18n';
import { PriceStore, RealtimeClient } from '@nabd/market-data';
import { FakeSocket } from '@nabd/testing';
import { API_URL } from '@nabd/testing/msw';

import type { AppServices } from '../app/providers/services';
import { LanguageStore } from '../lib/i18n/language-store';
import { ThemeStore } from '../lib/theme/theme';
import { createFakeChart } from './fake-chart';

const memoryStorage = () => {
  const data = new Map<string, string>();
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => {
      data.set(key, value);
    },
  };
};

/**
 * The whole service set with no browser or network behind it: in-memory storage, a fake socket
 * the test can drive, and a fake `html` element so a test only touches the real one on purpose.
 */
export function createTestServices({ language = 'en' }: { language?: Language } = {}) {
  const socket = new FakeSocket();
  const chart = createFakeChart();
  const i18n = createI18n(language);
  const languageRoot = { lang: '', dir: '' };
  const themeRoot = { dataset: {} as DOMStringMap };

  const services: AppServices = {
    i18n,
    languageStore: new LanguageStore(i18n, {
      storage: memoryStorage(),
      browserLanguages: () => [language],
      root: languageRoot,
    }),
    themeStore: new ThemeStore({
      storage: memoryStorage(),
      matchMedia: () => ({
        matches: false,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
      }),
      root: themeRoot,
    }),
    api: createApi(
      createHttpClient({
        baseUrl: API_URL,
        getClientId: () => '3f2b8c1e-5a4d-4e6f-9b7a-1c2d3e4f5a6b',
      }),
    ),
    queryClient: createQueryClient(),
    realtime: new RealtimeClient(socket, new PriceStore()),
    loadChart: chart.loader,
  };

  return { services, socket, languageRoot, themeRoot, chart };
}
