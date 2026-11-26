import { STORAGE_KEYS } from '../lib/storage/keys';
import { type AsyncKeyValueStore, StartupStorage } from '../lib/storage/startup-storage';

export interface Prepared {
  storage: StartupStorage;
}

export interface PrepareDependencies {
  store: AsyncKeyValueStore;
  loadFonts: () => Promise<void>;
}

/**
 * What must be ready before the first screen: the saved values and the fonts. It never rejects:
 * storage that cannot be read gives empty values, and fonts that fail to load leave the system
 * font, because a missing font is a worse reason to show no app than a different typeface is.
 */
export async function prepareApp({ store, loadFonts }: PrepareDependencies): Promise<Prepared> {
  const [storage] = await Promise.all([
    StartupStorage.load(store, STORAGE_KEYS),
    loadFonts().catch(() => undefined),
  ]);
  return { storage };
}
