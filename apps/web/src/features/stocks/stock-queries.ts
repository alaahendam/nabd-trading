import type { Period } from '@nabd/shared';
import { keepPreviousData, useInfiniteQuery, useQuery } from '@tanstack/react-query';

import { useApi } from '../../lib/api';
import { queryKeys } from '../../lib/query';

/** How many stocks one page of the list holds. */
export const STOCKS_PAGE_SIZE = 10;

/** Every stock, a page at a time. The next page starts after the last symbol of the previous. */
export function useStocksPages(enabled = true) {
  const api = useApi();
  return useInfiniteQuery({
    queryKey: queryKeys.stockPages(),
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam, signal }) =>
      api.listStocks(
        { limit: STOCKS_PAGE_SIZE, ...(pageParam === undefined ? {} : { cursor: pageParam }) },
        signal,
      ),
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    enabled,
  });
}

/** Only these stocks, in list order, in one request. Nothing is asked for without symbols. */
export function useStocksBySymbols(symbols: readonly string[] | undefined) {
  const api = useApi();
  const wanted = symbols ?? [];
  return useQuery({
    queryKey: queryKeys.stocksBySymbols(wanted),
    queryFn: ({ signal }) => api.listStocks({ symbols: wanted }, signal),
    enabled: wanted.length > 0,
    // A changed set keeps the rows on screen until the new answer arrives.
    placeholderData: keepPreviousData,
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
