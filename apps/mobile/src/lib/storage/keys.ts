import { CLIENT_ID_STORAGE_KEY } from '@nabd/api-client';
import { LANGUAGE_STORAGE_KEY } from '@nabd/i18n';

/** The same key as on the web, so a value means the same thing on both. */
export const THEME_STORAGE_KEY = 'nabd.theme';

/** Every value the app saves. All of them are read before the first render. */
export const STORAGE_KEYS = [CLIENT_ID_STORAGE_KEY, THEME_STORAGE_KEY, LANGUAGE_STORAGE_KEY];
