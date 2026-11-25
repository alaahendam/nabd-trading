// @vitest-environment jsdom
import type { StockWithQuote } from '@nabd/shared';
import { aapl, brkb, createFakeApi, fakeStocksServer, stocksPage } from '@nabd/testing';
import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { createQueryWrapper } from './test-wrapper.js';
import { useStockList } from './use-stock-list.js';

const stocks: StockWithQuote[] = [aapl, brkb];

const createHarness = () => {
  const api = createFakeApi();
  return { api, Wrapper: createQueryWrapper(api).wrapper };
};

describe('useStockList', () => {
  it('SRC-01 asks for the next page once when told to load more twice', async () => {
    const harness = createHarness();
    // Two stocks and a page size of ten would never have a next page, so serve a cursor by hand.
    harness.api.listStocks.resolvesOnce(stocksPage([aapl], 'AAPL', 2));
    const { result } = renderHook(() => useStockList(undefined), { wrapper: harness.Wrapper });
    await waitFor(() => {
      expect(result.current.hasMore).toBe(true);
    });
    harness.api.listStocks.returns(new Promise(() => undefined));

    act(() => {
      result.current.loadMore();
    });
    await waitFor(() => {
      expect(result.current.isLoadingMore).toBe(true);
    });
    act(() => {
      result.current.loadMore();
    });

    expect(harness.api.listStocks.calls).toHaveLength(2);
  });

  it('SRC-02 does nothing when there is no next page', async () => {
    const harness = createHarness();
    harness.api.listStocks.implement(fakeStocksServer(stocks));
    const { result } = renderHook(() => useStockList(undefined), { wrapper: harness.Wrapper });
    await waitFor(() => {
      expect(result.current.hasData).toBe(true);
    });
    expect(result.current.hasMore).toBe(false);

    act(() => {
      result.current.loadMore();
    });

    expect(harness.api.listStocks.calls).toHaveLength(1);
  });

  it('SRC-03 serves a filtered list from one request, cut to the symbols asked for', async () => {
    const harness = createHarness();
    harness.api.listStocks.implement(fakeStocksServer(stocks));
    const { result, rerender } = renderHook(({ symbols }) => useStockList(symbols), {
      wrapper: harness.Wrapper,
      initialProps: { symbols: ['AAPL', 'BRK.B'] as readonly string[] | undefined },
    });
    expect(result.current.isPending).toBe(true);
    await waitFor(() => {
      expect(result.current.hasData).toBe(true);
    });
    expect(result.current.stocks).toEqual([aapl, brkb]);
    expect(result.current).toMatchObject({
      total: 2,
      isPending: false,
      hasMore: false,
      isLoadingMore: false,
      loadMoreFailed: false,
    });
    expect(harness.api.listStocks.calls).toHaveLength(1);
    expect(harness.api.listStocks.calls[0]?.[0]).toEqual({ symbols: ['AAPL', 'BRK.B'] });

    act(() => {
      result.current.loadMore();
    });
    expect(harness.api.listStocks.calls).toHaveLength(1);

    // A symbol that was just removed leaves at once, before the new answer arrives.
    harness.api.listStocks.returns(new Promise(() => undefined));
    rerender({ symbols: ['AAPL'] });
    expect(result.current.stocks).toEqual([aapl]);
    expect(result.current.total).toBe(1);
  });

  it('SRC-04 has nothing to ask for, or wait for, with no symbols', () => {
    const harness = createHarness();
    const { result } = renderHook(() => useStockList([]), { wrapper: harness.Wrapper });
    expect(result.current).toMatchObject({ stocks: [], total: 0, isPending: false, hasData: true });
    expect(harness.api.listStocks.calls).toHaveLength(0);
  });

  it('SRC-05 refetches a filtered list when asked', async () => {
    const harness = createHarness();
    harness.api.listStocks.implement(fakeStocksServer(stocks));
    const { result } = renderHook(() => useStockList(['AAPL']), { wrapper: harness.Wrapper });
    await waitFor(() => {
      expect(result.current.hasData).toBe(true);
    });

    act(() => {
      result.current.refetch();
    });
    await waitFor(() => {
      expect(harness.api.listStocks.calls).toHaveLength(2);
    });
  });

  it('SRC-06 refetches the paged list when asked', async () => {
    const harness = createHarness();
    harness.api.listStocks.implement(fakeStocksServer(stocks));
    const { result } = renderHook(() => useStockList(undefined), { wrapper: harness.Wrapper });
    await waitFor(() => {
      expect(result.current.hasData).toBe(true);
    });

    act(() => {
      result.current.refetch();
    });
    await waitFor(() => {
      expect(harness.api.listStocks.calls).toHaveLength(2);
    });
  });
});
