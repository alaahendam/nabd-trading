import { QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

import { RealtimeProvider } from '../../features/market-data';
import { ApiProvider } from '../../lib/api';
import { I18nProvider } from '../../lib/i18n/i18n-provider';
import { ThemeProvider } from '../../lib/theme/theme-hooks';
import type { AppServices } from './services';

export function Providers({ services, children }: { services: AppServices; children: ReactNode }) {
  return (
    <I18nProvider i18n={services.i18n} store={services.languageStore}>
      <ThemeProvider store={services.themeStore}>
        <ApiProvider api={services.api}>
          <QueryClientProvider client={services.queryClient}>
            <RealtimeProvider client={services.realtime}>{children}</RealtimeProvider>
          </QueryClientProvider>
        </ApiProvider>
      </ThemeProvider>
    </I18nProvider>
  );
}
