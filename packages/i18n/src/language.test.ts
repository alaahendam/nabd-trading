import { describe, expect, it } from 'vitest';

import { applyDocumentLanguage, detectLanguage, directionOf, parseLanguage } from './language.js';

describe('parseLanguage', () => {
  it.each([
    ['en', 'en'],
    ['ar', 'ar'],
    ['fr', undefined],
    ['', undefined],
    [null, undefined],
    [5, undefined],
  ])('LNG-01 parses %j as %j', (value, expected) => {
    expect(parseLanguage(value)).toBe(expected);
  });
});

describe('detectLanguage', () => {
  it.each([
    ['a stored choice', { stored: 'ar', browser: ['en-US'] }, 'ar'],
    ['stored garbage, then the browser', { stored: 'xx', browser: ['en-US'] }, 'en'],
    ['the first supported browser language', { stored: null, browser: ['fr-FR', 'ar-EG'] }, 'ar'],
    ['no supported browser language', { stored: null, browser: ['fr'] }, 'en'],
    ['no browser languages', { stored: null, browser: [] }, 'en'],
    ['stored English over an Arabic browser', { stored: 'en', browser: ['ar'] }, 'en'],
    ['an upper-case region tag', { stored: null, browser: ['AR-SA'] }, 'ar'],
  ] as const)('LNG-02 uses %s', (_label, input, expected) => {
    expect(detectLanguage(input)).toBe(expected);
  });
});

describe('directionOf and applyDocumentLanguage', () => {
  it('LNG-03 gives each language its direction', () => {
    expect(directionOf('en')).toBe('ltr');
    expect(directionOf('ar')).toBe('rtl');
  });

  it('LNG-04 sets lang and dir on the document root', () => {
    const root = { lang: '', dir: '' };
    applyDocumentLanguage(root, 'ar');
    expect(root).toEqual({ lang: 'ar', dir: 'rtl' });
    applyDocumentLanguage(root, 'en');
    expect(root).toEqual({ lang: 'en', dir: 'ltr' });
  });
});
