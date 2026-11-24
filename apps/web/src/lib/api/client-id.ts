import { clientIdSchema } from '@nabd/shared';

export const CLIENT_ID_STORAGE_KEY = 'nabd.clientId';

export interface ClientIdStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export type ClientIdProvider = () => string;

export function createClientIdProvider(
  storage: ClientIdStorage,
  generate: () => string,
): ClientIdProvider {
  let current: string | undefined;

  const readStored = (): string | undefined => {
    try {
      const parsed = clientIdSchema.safeParse(storage.getItem(CLIENT_ID_STORAGE_KEY));
      return parsed.success ? parsed.data : undefined;
    } catch {
      return undefined;
    }
  };

  const persist = (id: string): void => {
    try {
      storage.setItem(CLIENT_ID_STORAGE_KEY, id);
    } catch {
      // Storage can be blocked; the ID then lives for this page load only.
    }
  };

  return () => {
    if (current !== undefined) return current;
    const stored = readStored();
    if (stored !== undefined) {
      current = stored;
      return stored;
    }
    const created = generate();
    persist(created);
    current = created;
    return created;
  };
}

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
