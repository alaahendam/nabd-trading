import type { AppServices } from '../app/providers/services';
import { PriceStore } from '../features/market-data/price-store';
import { RealtimeClient } from '../features/market-data/realtime-client';
import { createApi } from '../lib/api/endpoints';
import { createHttpClient } from '../lib/api/http-client';
import { createI18n } from '../lib/i18n/i18n';
import type { Language } from '../lib/i18n/language';
import { LanguageStore } from '../lib/i18n/language-store';
import { createQueryClient } from '../lib/query/query-client';
import { ThemeStore } from '../lib/theme/theme';
import { FakeSocket } from './fake-socket';
import { API_URL } from './msw';

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
  };

  return { services, socket, languageRoot, themeRoot };
}
