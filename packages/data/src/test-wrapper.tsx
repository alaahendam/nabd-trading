import type { Api } from '@nabd/api-client';
import type { QueryClient } from '@tanstack/react-query';
import { QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

import { ApiProvider } from './api-provider.js';
import { createQueryClient } from './query-client.js';

/** A wrapper giving hooks the API and a fresh query client, so no cache leaks between tests. */
export function createQueryWrapper(api: Api, queryClient: QueryClient = createQueryClient()) {
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <ApiProvider api={api}>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </ApiProvider>
    );
  }
  return { wrapper: Wrapper, queryClient };
}
