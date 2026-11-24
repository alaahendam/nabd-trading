import type { DataRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';

import { Providers } from './providers/providers';
import type { AppServices } from './providers/services';

export function App({ services, router }: { services: AppServices; router: DataRouter }) {
  return (
    <Providers services={services}>
      <RouterProvider router={router} />
    </Providers>
  );
}
