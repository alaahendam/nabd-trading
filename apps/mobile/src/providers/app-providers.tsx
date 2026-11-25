import type { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';

import { ThemeProvider } from '../lib/theme/theme-provider';
import type { Services } from './services';

/** Everything the screens need around them. */
export function AppProviders({ services, children }: { services: Services; children: ReactNode }) {
  return (
    <I18nextProvider i18n={services.i18n}>
      <ThemeProvider store={services.themeStore}>{children}</ThemeProvider>
    </I18nextProvider>
  );
}
