import { LANGUAGE_STORAGE_KEY } from '@nabd/i18n';

import { switchLanguage } from './switch-language';

/** A stand-in for the device and the storage, writing down what was asked of them in order. */
function setup({ saves = true }: { saves?: boolean } = {}) {
  const calls: string[] = [];
  return {
    calls,
    environment: (current: 'en' | 'ar') => ({
      current,
      storageKey: LANGUAGE_STORAGE_KEY,
      storage: {
        saveItem: (key: string, value: string) => {
          calls.push(`save ${key}=${value}`);
          return Promise.resolve(saves);
        },
      },
      layout: {
        allowRTL: (allow: boolean) => calls.push(`allowRTL ${String(allow)}`),
        forceRTL: (force: boolean) => calls.push(`forceRTL ${String(force)}`),
        reload: () => {
          calls.push('reload');
          return Promise.resolve();
        },
      },
    }),
  };
}

describe('switchLanguage', () => {
  it('LNG-01 saves Arabic, sets the layout right-to-left, then reloads, in that order', async () => {
    const { calls, environment } = setup();

    const result = await switchLanguage('ar', environment('en'));

    expect(result).toBe('switched');
    expect(calls).toEqual(['save nabd.language=ar', 'allowRTL true', 'forceRTL true', 'reload']);
  });

  it('LNG-01 saves English, sets the layout left-to-right, then reloads', async () => {
    const { calls, environment } = setup();

    await switchLanguage('en', environment('ar'));

    expect(calls).toEqual(['save nabd.language=en', 'allowRTL true', 'forceRTL false', 'reload']);
  });

  it('LNG-02 does nothing for the language already in use', async () => {
    const { calls, environment } = setup();

    expect(await switchLanguage('en', environment('en'))).toBe('unchanged');
    expect(await switchLanguage('ar', environment('ar'))).toBe('unchanged');

    expect(calls).toEqual([]);
  });

  it('LNG-01 leaves the app alone when the choice cannot be saved', async () => {
    const { calls, environment } = setup({ saves: false });

    const result = await switchLanguage('ar', environment('en'));

    expect(result).toBe('not-saved');
    expect(calls).toEqual(['save nabd.language=ar']);
  });
});
