import type { ReactNode } from 'react';
import { createContext, use } from 'react';

import type { Api } from './endpoints';

const ApiContext = createContext<Api | undefined>(undefined);

export function ApiProvider({ api, children }: { api: Api; children: ReactNode }) {
  return <ApiContext value={api}>{children}</ApiContext>;
}

export function useApi(): Api {
  const api = use(ApiContext);
  if (api === undefined) throw new Error('useApi must be used inside an ApiProvider');
  return api;
}
