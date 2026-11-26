import { useMemo } from 'react';

import { AppProviders } from './app-providers';
import { ErrorScreen } from './error-screen';
import { createServices } from './services';

/** No saved values are read here: when this shows, something already went wrong. */
const nothingSaved = { getItem: () => null, setItem: () => undefined };

/**
 * Expo Router's error boundary for the whole app. It replaces the root layout when that or a
 * screen throws, so the providers inside the layout are gone. It brings its own (English, the
 * system theme) instead of depending on what may have been the problem.
 */
export function ErrorBoundary({ retry }: { error: Error; retry: () => Promise<void> }) {
  const services = useMemo(() => createServices(nothingSaved), []);

  return (
    <AppProviders services={services}>
      <ErrorScreen
        retry={() => {
          void retry();
        }}
      />
    </AppProviders>
  );
}
