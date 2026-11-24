import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { I18nextProvider } from 'react-i18next';

import { createI18n } from '../lib/i18n/i18n';
import type { Language } from '../lib/i18n/language';

/**
 * Renders a tree with translations only, for components that read text but no other context.
 * `rerender` keeps the provider, so a changed prop is still rendered in the same language.
 */
export function renderWithI18n(ui: ReactElement, language: Language = 'en') {
  const i18n = createI18n(language);
  const wrap = (element: ReactElement) => <I18nextProvider i18n={i18n}>{element}</I18nextProvider>;
  const utils = render(wrap(ui));
  return {
    ...utils,
    rerender: (next: ReactElement) => {
      utils.rerender(wrap(next));
    },
  };
}
