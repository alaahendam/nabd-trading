import { directionOf, type Language } from '@nabd/i18n';

import type { DeviceLayout } from './device-layout';

export interface LanguageSwitchEnvironment {
  /** The language in use now. */
  current: Language;
  storage: { saveItem(key: string, value: string): Promise<boolean> };
  layout: DeviceLayout;
  storageKey: string;
}

/** What happened: the app reloads after `switched`, and nothing changed otherwise. */
export type LanguageSwitchResult = 'switched' | 'unchanged' | 'not-saved';

/**
 * Changes the language. The layout direction is native and only takes effect when the app starts
 * again, so the choice is saved first (a reload must not cut the write short), then the direction
 * is set, then the app reloads and starts in the new language. If the choice cannot be saved the
 * app is left as it is: a reload would bring the old language back, with the wrong direction.
 */
export async function switchLanguage(
  next: Language,
  { current, storage, layout, storageKey }: LanguageSwitchEnvironment,
): Promise<LanguageSwitchResult> {
  if (next === current) return 'unchanged';
  if (!(await storage.saveItem(storageKey, next))) return 'not-saved';
  layout.allowRTL(true);
  layout.forceRTL(directionOf(next) === 'rtl');
  await layout.reload();
  return 'switched';
}
