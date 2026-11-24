import { act, render, renderHook, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { describe, expect, it, vi } from 'vitest';

import { createI18n } from './i18n';
import { I18nProvider, useLanguage } from './i18n-provider';
import { LanguageStore } from './language-store';

const makeStore = () => {
  const i18n = createI18n('en');
  const root = { lang: '', dir: '' };
  const store = new LanguageStore(i18n, {
    storage: { getItem: () => null, setItem: () => undefined },
    browserLanguages: () => [],
    root,
  });
  return { i18n, store, root };
};

describe('I18nProvider and useLanguage', () => {
  it('LNG-11 follows a language change in text, direction and the document', () => {
    const { i18n, store, root } = makeStore();
    const Probe = () => {
      const { t } = useTranslation();
      const { language, direction, setLanguage } = useLanguage();
      return (
        <button
          type="button"
          onClick={() => {
            setLanguage('ar');
          }}
        >
          {t('nav.stocks')}/{language}/{direction}
        </button>
      );
    };
    render(
      <I18nProvider i18n={i18n} store={store}>
        <Probe />
      </I18nProvider>,
    );
    expect(screen.getByRole('button')).toHaveTextContent('Stocks/en/ltr');

    act(() => {
      screen.getByRole('button').click();
    });
    expect(screen.getByRole('button')).toHaveTextContent(`${i18n.t('nav.stocks')}/ar/rtl`);
    expect(screen.getByRole('button')).not.toHaveTextContent('Stocks');
    expect(root).toEqual({ lang: 'ar', dir: 'rtl' });
  });

  it('LNG-11 hands out the same setter on every render', () => {
    const { i18n, store } = makeStore();
    const wrapper = ({ children }: { children: ReactNode }) => (
      <I18nProvider i18n={i18n} store={store}>
        {children}
      </I18nProvider>
    );
    const { result, rerender } = renderHook(() => useLanguage(), { wrapper });
    const first = result.current.setLanguage;
    rerender();
    expect(result.current.setLanguage).toBe(first);
  });

  it('LNG-12 useLanguage needs the provider', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(() => renderHook(() => useLanguage())).toThrow(/I18nProvider/);
    error.mockRestore();
  });
});
