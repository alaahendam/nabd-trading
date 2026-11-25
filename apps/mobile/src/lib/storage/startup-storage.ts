import type { ClientIdStorage } from '@nabd/api-client';

/** The part of AsyncStorage the app uses. Tests pass a fake with the same two methods. */
export interface AsyncKeyValueStore {
  multiGet(keys: readonly string[]): Promise<readonly (readonly [string, string | null])[]>;
  setItem(key: string, value: string): Promise<void>;
}

/**
 * The app's few saved values (client ID, theme, language), read once before the first render.
 *
 * The stores and the API client ask for them synchronously, and AsyncStorage is asynchronous, so
 * the values are loaded while the splash screen is held. After that reads come from memory and
 * writes go through to storage. Storage that cannot be read or written never stops the app: a
 * failed read starts it with empty values, and a failed write is kept for the session only.
 */
export class StartupStorage implements ClientIdStorage {
  private constructor(
    private readonly store: AsyncKeyValueStore,
    private readonly values: Map<string, string>,
  ) {}

  static async load(store: AsyncKeyValueStore, keys: readonly string[]): Promise<StartupStorage> {
    const values = new Map<string, string>();
    try {
      for (const [key, value] of await store.multiGet(keys)) {
        if (value !== null) {
          values.set(key, value);
        }
      }
    } catch {
      // Start with nothing saved.
    }
    return new StartupStorage(store, values);
  }

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
    // Not awaited: the value is already readable, and a failed write only means it is not kept.
    this.store.setItem(key, value).catch(() => undefined);
  }
}
