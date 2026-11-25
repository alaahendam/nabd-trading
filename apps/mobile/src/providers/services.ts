import { type Api, createApi, createClientIdProvider, createHttpClient } from '@nabd/api-client';
import { createQueryClient } from '@nabd/data';
import { createI18n } from '@nabd/i18n';
import { createRealtimeClient, type RealtimeClient } from '@nabd/market-data';
import type { QueryClient } from '@tanstack/react-query';
import { randomUUID } from 'expo-crypto';
import type { i18n } from 'i18next';

import { readLanguage } from '../lib/i18n/read-language';
import type { StartupStorage } from '../lib/storage/startup-storage';
import { deviceScheme } from '../lib/theme/device-scheme';
import { ThemeStore } from '../lib/theme/theme-store';

/** What every screen needs, including the one that explains a bad configuration. */
export interface Services {
  i18n: i18n;
  themeStore: ThemeStore;
}

export function createServices(storage: StartupStorage): Services {
  return {
    i18n: createI18n(readLanguage(storage)),
    themeStore: new ThemeStore({ storage, ...deviceScheme }),
  };
}

/** What only a correctly configured app has: it needs the API's address. */
export interface DataServices {
  api: Api;
  queryClient: QueryClient;
  realtime: RealtimeClient;
}

export function createDataServices(storage: StartupStorage, apiUrl: string): DataServices {
  return {
    api: createApi(
      createHttpClient({
        baseUrl: apiUrl,
        getClientId: createClientIdProvider(storage, () => randomUUID()),
      }),
    ),
    queryClient: createQueryClient(),
    realtime: createRealtimeClient(apiUrl),
  };
}
