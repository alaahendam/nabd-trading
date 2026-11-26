import { ApiProvider } from '@nabd/data';
import { RealtimeProvider } from '@nabd/market-data';
import { QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { AppState } from 'react-native';

import { networkConnectivity } from '../lib/network/network-connectivity';
import { useAppLifecycle } from '../lib/realtime/use-app-lifecycle';
import type { DataServices } from './services';

/**
 * The data layer around the screens: the API, the query cache and the live connection. The
 * connection follows the device's network and the app's lifecycle (closed in the background).
 */
export function DataProviders({
  services,
  children,
}: {
  services: DataServices;
  children: ReactNode;
}) {
  useAppLifecycle(services.realtime, AppState);

  return (
    <ApiProvider api={services.api}>
      <QueryClientProvider client={services.queryClient}>
        <RealtimeProvider client={services.realtime} connectivity={networkConnectivity}>
          {children}
        </RealtimeProvider>
      </QueryClientProvider>
    </ApiProvider>
  );
}
