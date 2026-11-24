import { describe, expect, it } from 'vitest';

import { createI18n } from './i18n';
import { resources } from './resources';

interface Tree {
  readonly [key: string]: string | Tree;
}

const PLURAL_SUFFIX = /_(zero|one|two|few|many|other)$/;

/** Every string with its dotted path. */
function flatten(tree: Tree, prefix = ''): [string, string][] {
  return Object.entries(tree).flatMap(([key, value]) =>
    typeof value === 'string'
      ? [[`${prefix}${key}`, value] as [string, string]]
      : flatten(value, `${prefix}${key}.`),
  );
}

const english = flatten(resources.en.translation);
const arabic = flatten(resources.ar.translation);
const arabicText = new Map(arabic);

const baseKey = (key: string) => key.replace(PLURAL_SUFFIX, '');
const placeholders = (text: string) =>
  Array.from(text.matchAll(/\{\{\s*(\w+)\s*\}\}/g), (match) => match[1] ?? '').sort();

describe('resources', () => {
  it('RES-01 have the same keys in both languages', () => {
    const keys = (entries: [string, string][]) =>
      [...new Set(entries.map(([key]) => baseKey(key)))].sort();
    expect(keys(arabic)).toEqual(keys(english));
  });

  it.each([
    ['en', english],
    ['ar', arabic],
  ] as const)(
    'RES-02 %s has exactly its plural categories for every plural key',
    (language, entries) => {
      const expected = new Intl.PluralRules(language).resolvedOptions().pluralCategories.sort();
      const plural = new Map<string, string[]>();
      for (const [key] of entries) {
        const category = PLURAL_SUFFIX.exec(key)?.[1];
        if (category !== undefined) {
          plural.set(baseKey(key), [...(plural.get(baseKey(key)) ?? []), category]);
        }
      }
      expect(plural.size).toBeGreaterThan(0);
      for (const categories of plural.values()) {
        expect([...categories].sort()).toEqual(expected);
      }
    },
  );

  it.each([
    ['en', english],
    ['ar', arabic],
  ] as const)('RES-03 %s has clean strings', (_language, entries) => {
    for (const [key, text] of entries) {
      expect(text, key).not.toBe('');
      expect(text, key).toBe(text.trim());
      expect(text, key).not.toMatch(/[٠-٩۰-۹]/);
    }
  });

  it('RES-04 use the same placeholders in both languages', () => {
    const arabicPlaceholders = new Map<string, Set<string>>();
    for (const [key, text] of arabic) {
      const base = baseKey(key);
      arabicPlaceholders.set(
        base,
        new Set([...(arabicPlaceholders.get(base) ?? []), ...placeholders(text)]),
      );
    }
    for (const [key, text] of english) {
      for (const name of placeholders(text)) {
        expect(
          arabicPlaceholders.get(baseKey(key))?.has(name),
          `${key} needs {{${name}}} in Arabic`,
        ).toBe(true);
      }
    }
  });
});

describe('createI18n', () => {
  it('RES-05 translates into each language', () => {
    expect(createI18n('en').t('nav.stocks')).toBe('Stocks');
    expect(createI18n('ar').t('nav.stocks')).toBe(arabicText.get('nav.stocks'));
    expect(createI18n('ar').t('nav.stocks')).not.toBe('Stocks');
  });

  it.each([
    [1, '1 stock'],
    [2, '2 stocks'],
  ])('RES-05 English plural for %i is %s', (count, expected) => {
    expect(createI18n('en').t('count.stocks', { count })).toBe(expected);
  });

  it.each([
    [0, 'zero'],
    [1, 'one'],
    [2, 'two'],
    [3, 'few'],
    [11, 'many'],
    [100, 'other'],
  ])('RES-05 Arabic plural for %i uses the %s form with Latin digits', (count, form) => {
    const template = arabicText.get(`count.stocks_${form}`) ?? '';
    const text = createI18n('ar').t('count.stocks', { count });
    expect(text).toBe(template.replace('{{count}}', String(count)));
    expect(text).not.toMatch(/[٠-٩]/);
  });

  it('RES-06 falls back to English when a key is missing in the chosen language', () => {
    const i18n = createI18n('ar');
    expect(i18n.t('nav.stocks')).not.toBe('Stocks');

    i18n.removeResourceBundle('ar', 'translation');
    expect(i18n.t('nav.stocks')).toBe('Stocks');
  });
});
