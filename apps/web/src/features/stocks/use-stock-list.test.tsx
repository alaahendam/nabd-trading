import type { StockWithQuote } from '@nabd/shared';
import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { createFeatureHarness } from '../../test/feature-harness';
import { aapl, brkb, fakeStocksServer, stocksPage } from '../../test/fixtures';
import { useStockList } from './use-stock-list';

const stocks: StockWithQuote[] = [aapl, brkb];

describe('useStockList', () => {
  it('SRC-01 asks for the next page once when told to load more twice', async () => {
    const harness = createFeatureHarness();
    // Two stocks and a page size of ten would never have a next page, so serve a cursor by hand.
    harness.api.listStocks.mockResolvedValueOnce(stocksPage([aapl], 'AAPL', 2));
    const { result } = renderHook(() => useStockList(undefined), { wrapper: harness.Wrapper });
    await waitFor(() => {
      expect(result.current.hasMore).toBe(true);
    });
    harness.api.listStocks.mockReturnValue(new Promise(() => undefined));

    act(() => {
      result.current.loadMore();
    });
    await waitFor(() => {
      expect(result.current.isLoadingMore).toBe(true);
    });
    act(() => {
      result.current.loadMore();
    });

    expect(harness.api.listStocks).toHaveBeenCalledTimes(2);
  });

  it('SRC-02 does nothing when there is no next page', async () => {
    const harness = createFeatureHarness();
    harness.api.listStocks.mockImplementation(fakeStocksServer(stocks));
    const { result } = renderHook(() => useStockList(undefined), { wrapper: harness.Wrapper });
    await waitFor(() => {
      expect(result.current.hasData).toBe(true);
    });
    expect(result.current.hasMore).toBe(false);

    act(() => {
      result.current.loadMore();
    });

    expect(harness.api.listStocks).toHaveBeenCalledTimes(1);
  });
});
