import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { I18nextProvider } from 'react-i18next';

import { createI18n } from '../lib/i18n/i18n';
import type { Language } from '../lib/i18n/language';

/** Renders a tree with translations only, for components that read text but no other context. */
export function renderWithI18n(ui: ReactElement, language: Language = 'en') {
  return render(<I18nextProvider i18n={createI18n(language)}>{ui}</I18nextProvider>);
}
