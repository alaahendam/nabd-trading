import type { WatchlistItem } from '@nabd/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useApi } from './api-provider.js';
import { queryKeys } from './query-keys.js';

export function useWatchlist() {
  const api = useApi();
  return useQuery({
    queryKey: queryKeys.watchlist(),
    queryFn: ({ signal }) => api.listWatchlist(signal),
  });
}

interface ToggleVariables {
  symbol: string;
  /** `true` adds the symbol, `false` removes it. */
  watch: boolean;
}

/**
 * Adds or removes a symbol. The cache changes at once, so the star and the watchlist page react
 * without waiting for the server; if the call fails the previous list is put back, and the list is
 * fetched again either way so the cache ends up as the server has it. Writes are not retried.
 */
export function useWatchlistToggle() {
  const api = useApi();
  const queryClient = useQueryClient();
  const key = queryKeys.watchlist();

  return useMutation({
    mutationFn: async ({ symbol, watch }: ToggleVariables) => {
      if (watch) {
        await api.addToWatchlist(symbol);
      } else {
        await api.removeFromWatchlist(symbol);
      }
    },
    onMutate: async ({ symbol, watch }) => {
      // A fetch that finishes after this would overwrite the optimistic list with an old one.
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<WatchlistItem[]>(key);
      queryClient.setQueryData<WatchlistItem[]>(key, (current = []) => {
        if (!watch) {
          return current.filter((item) => item.symbol !== symbol);
        }
        return current.some((item) => item.symbol === symbol)
          ? current
          : [...current, { symbol, addedAt: Date.now() }];
      });
      return { previous };
    },
    onError: (_error, _variables, context) => {
      // Without a snapshot nothing was known before, so nothing is shown until the refetch below.
      queryClient.setQueryData<WatchlistItem[]>(key, context?.previous ?? []);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
  });
}
