import { createI18n, DEFAULT_LANGUAGE } from '@nabd/i18n';
import type { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';

// English until M2, which chooses the language from the device and remembers the user's choice.
const i18n = createI18n(DEFAULT_LANGUAGE);

/** Everything the screens need around them. Grows in M2 (theme, query client, realtime). */
export function AppProviders({ children }: { children: ReactNode }) {
  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
