import { createI18n } from '@nabd/i18n';
import type { i18n } from 'i18next';

import { readLanguage } from '../lib/i18n/read-language';
import type { StartupStorage } from '../lib/storage/startup-storage';
import { deviceScheme } from '../lib/theme/device-scheme';
import { ThemeStore } from '../lib/theme/theme-store';

/** What the app depends on that lives outside React. Grows with the data layer. */
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
