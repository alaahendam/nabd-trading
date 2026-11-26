import { type ClientIdProvider, createClientIdProvider } from '@nabd/api-client';

/** The browser's way to keep the anonymous client ID: `localStorage` and `crypto.randomUUID`. */
export const createBrowserClientIdProvider = (): ClientIdProvider =>
  createClientIdProvider(
    {
      getItem: (key) => localStorage.getItem(key),
      setItem: (key, value) => {
        localStorage.setItem(key, value);
      },
    },
    () => crypto.randomUUID(),
  );
