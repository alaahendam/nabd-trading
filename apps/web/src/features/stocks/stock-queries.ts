import type { Period } from '@nabd/shared';
import { useQuery } from '@tanstack/react-query';

import { useApi } from '../../lib/api';
import { queryKeys } from '../../lib/query';

export function useStocks() {
  const api = useApi();
  return useQuery({
    queryKey: queryKeys.stocks(),
    queryFn: ({ signal }) => api.listStocks(signal),
  });
}

export function useStock(symbol: string) {
  const api = useApi();
  return useQuery({
    queryKey: queryKeys.stock(symbol),
    queryFn: ({ signal }) => api.getStock(symbol, signal),
  });
}

export function useHistory(symbol: string, period: Period) {
  const api = useApi();
  return useQuery({
    queryKey: queryKeys.history(symbol, period),
    queryFn: ({ signal }) => api.getHistory(symbol, period, signal),
  });
}
