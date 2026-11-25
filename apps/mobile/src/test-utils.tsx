import { render } from '@testing-library/react-native';
import type { ReactElement } from 'react';

import { type AsyncKeyValueStore, StartupStorage } from './lib/storage/startup-storage';
import { AppProviders } from './providers/app-providers';
import { createServices } from './providers/services';

/** An in-memory stand-in for AsyncStorage, holding the given saved values. */
export function createMemoryStore(initial: Record<string, string> = {}): AsyncKeyValueStore {
  const data = new Map(Object.entries(initial));
  return {
    multiGet: (keys) => Promise.resolve(keys.map((key) => [key, data.get(key) ?? null] as const)),
    setItem: (key, value) => {
      data.set(key, value);
      return Promise.resolve();
    },
  };
}

/** Renders a component inside the app's providers, in English, with the given saved values. */
export async function renderWithProviders(ui: ReactElement, saved: Record<string, string> = {}) {
  const storage = await StartupStorage.load(createMemoryStore(saved), Object.keys(saved));
  return render(<AppProviders services={createServices(storage)}>{ui}</AppProviders>);
}
