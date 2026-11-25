import { runInNewContext } from 'node:vm';

import { detectLanguage, directionOf, LANGUAGE_STORAGE_KEY } from '@nabd/i18n';
import { describe, expect, it } from 'vitest';

import indexHtml from '../../../index.html?raw';

describe('the pre-paint script in index.html', () => {
  const script = /<script>([\s\S]*?)<\/script>/.exec(indexHtml)?.[1] ?? '';

  /** Runs the script in an isolated context with a fake browser and returns the root's lang and dir. */
  const run = ({
    stored,
    browser,
    storageThrows = false,
    noNavigatorLanguages = false,
  }: {
    stored?: string;
    browser: readonly string[];
    storageThrows?: boolean;
    noNavigatorLanguages?: boolean;
  }) => {
    const documentElement = { dataset: {}, lang: '', dir: '' };
    runInNewContext(script, {
      localStorage: {
        getItem: (key: string) => {
          if (storageThrows) {
            throw new Error('blocked');
          }
          return key === LANGUAGE_STORAGE_KEY ? (stored ?? null) : null;
        },
      },
      matchMedia: () => ({ matches: false }),
      navigator: noNavigatorLanguages ? {} : { languages: browser },
      document: { documentElement },
    });
    return { lang: documentElement.lang, dir: documentElement.dir };
  };

  it('LNG-09 finds the script', () => {
    expect(script).toContain(LANGUAGE_STORAGE_KEY);
  });

  it.each([
    ['stored ar', { stored: 'ar', browser: ['en-US'] }],
    ['stored garbage and an English browser', { stored: 'xx', browser: ['en-US'] }],
    ['no stored value, French then Arabic', { browser: ['fr-FR', 'ar-EG'] }],
    ['no supported browser language', { browser: ['fr'] }],
    ['no browser languages', { browser: [] }],
    ['stored en over an Arabic browser', { stored: 'en', browser: ['ar'] }],
    ['storage throwing with an Arabic browser', { browser: ['ar'], storageThrows: true }],
    ['upper-case region tag', { browser: ['AR-SA'] }],
    ['no navigator.languages at all', { browser: ['ar'], noNavigatorLanguages: true }],
  ])('LNG-09 matches the detection logic: %s', (_label, input) => {
    const stored = 'stored' in input ? input.stored : undefined;
    const storageThrows = 'storageThrows' in input && input.storageThrows;
    // Without navigator.languages the script sees no browser languages, whatever the test lists.
    const missing = 'noNavigatorLanguages' in input && input.noNavigatorLanguages;
    const expected = detectLanguage({
      stored: storageThrows ? undefined : stored,
      browser: missing ? [] : input.browser,
    });
    expect(run(input)).toEqual({ lang: expected, dir: directionOf(expected) });
  });
});
