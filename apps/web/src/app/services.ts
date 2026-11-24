import type { QueryClient } from '@tanstack/react-query';
import type { i18n } from 'i18next';

import { createRealtimeClient, type RealtimeClient } from '../features/market-data';
import { type Api, createApi, createBrowserClientIdProvider, createHttpClient } from '../lib/api';
import { createI18n } from '../lib/i18n/i18n';
import { DEFAULT_LANGUAGE } from '../lib/i18n/language';
import { browserLanguageEnvironment, LanguageStore } from '../lib/i18n/language-store';
import { createQueryClient } from '../lib/query';
import { browserThemeEnvironment, ThemeStore } from '../lib/theme/theme';

/** Everything the app depends on that lives outside React. Tests build the same set from fakes. */
export interface AppServices {
  i18n: i18n;
  languageStore: LanguageStore;
  themeStore: ThemeStore;
  api: Api;
  queryClient: QueryClient;
  realtime: RealtimeClient;
}

export function createServices(apiUrl: string): AppServices {
  // The language store picks the language (saved choice, then browser) and applies it to i18next.
  const i18n = createI18n(DEFAULT_LANGUAGE);

  return {
    i18n,
    languageStore: new LanguageStore(i18n, browserLanguageEnvironment()),
    themeStore: new ThemeStore(browserThemeEnvironment()),
    api: createApi(
      createHttpClient({ baseUrl: apiUrl, getClientId: createBrowserClientIdProvider() }),
    ),
    queryClient: createQueryClient(),
    realtime: createRealtimeClient(apiUrl),
  };
}
