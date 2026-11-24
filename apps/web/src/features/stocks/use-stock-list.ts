import type { StockWithQuote } from '@nabd/shared';
import { useCallback } from 'react';

import { useStocksBySymbols, useStocksPages } from './stock-queries';

export interface StockListData {
  stocks: StockWithQuote[];
  /** How many stocks the list has in all, not only the ones loaded. */
  total: number;
  /** The first load is still running. */
  isPending: boolean;
  /** At least one answer has arrived, so a failed refresh does not replace the rows. */
  hasData: boolean;
  hasMore: boolean;
  isLoadingMore: boolean;
  loadMoreFailed: boolean;
  /** Safe to call at any time: it does nothing while a page is loading or at the end. */
  loadMore: () => void;
  refetch: () => void;
}

/**
 * One shape for the two ways the list is fed: every stock a page at a time, or just the symbols
 * asked for in one request (the watchlist). A filtered list is cut to the current symbols on the
 * client, so a symbol that was just removed leaves at once, before the new answer arrives.
 */
export function useStockList(symbols: readonly string[] | undefined): StockListData {
  const paged = useStocksPages(symbols === undefined);
  const filtered = useStocksBySymbols(symbols);

  const { hasNextPage, isFetchingNextPage, fetchNextPage } = paged;
  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (symbols === undefined) {
    const pages = paged.data?.pages ?? [];
    return {
      stocks: pages.flatMap((page) => page.stocks),
      total: pages[0]?.total ?? 0,
      isPending: paged.isPending,
      hasData: paged.data !== undefined,
      hasMore: hasNextPage,
      isLoadingMore: isFetchingNextPage,
      loadMoreFailed: paged.isFetchNextPageError,
      loadMore,
      refetch: () => {
        void paged.refetch();
      },
    };
  }

  const wanted = new Set(symbols);
  const stocks = (filtered.data?.stocks ?? []).filter((stock) => wanted.has(stock.symbol));
  return {
    stocks,
    total: stocks.length,
    // With no symbols there is nothing to ask for, so nothing to wait for.
    isPending: symbols.length > 0 && filtered.isPending,
    hasData: symbols.length === 0 || filtered.data !== undefined,
    hasMore: false,
    isLoadingMore: false,
    loadMoreFailed: false,
    loadMore,
    refetch: () => {
      void filtered.refetch();
    },
  };
}
