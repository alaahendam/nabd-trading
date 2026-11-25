import { ApiClientError } from '@nabd/api-client';
import { createFakeApi } from '@nabd/testing';
import { aapl, aaplHistory, brkb, stocksPage } from '@nabd/testing';
import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { queryKeys } from '../../lib/query';
import { createQueryWrapper } from '../../test/query-wrapper';
import { useHistory, useStock, useStocksBySymbols, useStocksPages } from './stock-queries';

describe('stock queries', () => {
  it('STK-01 loads the first page of the stock list', async () => {
    const api = createFakeApi();
    api.listStocks.resolves(stocksPage([aapl, brkb]));
    const { wrapper } = createQueryWrapper(api);

    const { result } = renderHook(() => useStocksPages(), { wrapper });
    expect(result.current.isPending).toBe(true);

    await waitFor(() => {
      expect(result.current.data?.pages[0]?.stocks).toEqual([aapl, brkb]);
    });
    expect(api.listStocks.calls).toHaveLength(1);
  });

  it('STK-02 reports a failure without retrying a permanent error', async () => {
    const api = createFakeApi();
    const error = new ApiClientError({ kind: 'http', status: 404, message: 'nope' });
    api.listStocks.rejects(error);
    const { wrapper } = createQueryWrapper(api);

    const { result } = renderHook(() => useStocksPages(), { wrapper });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
    expect(result.current.error).toBe(error);
    expect(api.listStocks.calls).toHaveLength(1);
  });

  it('STK-03 passes the abort signal on, in every hook', async () => {
    const api = createFakeApi();
    api.listStocks.resolves(stocksPage([aapl]));
    api.getStock.resolves(aapl);
    api.getHistory.resolves(aaplHistory);
    const { wrapper } = createQueryWrapper(api);

    const { result } = renderHook(
      () => ({
        pages: useStocksPages(),
        filtered: useStocksBySymbols(['AAPL']),
        one: useStock('AAPL'),
        history: useHistory('AAPL', '1W'),
      }),
      { wrapper },
    );
    await waitFor(() => {
      expect(result.current.history.isSuccess).toBe(true);
      expect(result.current.one.isSuccess).toBe(true);
      expect(result.current.pages.isSuccess).toBe(true);
      expect(result.current.filtered.isSuccess).toBe(true);
    });

    for (const call of api.listStocks.calls) {
      expect(call[1]).toBeInstanceOf(AbortSignal);
    }
    expect(api.getStock.calls[0]?.[1]).toBeInstanceOf(AbortSignal);
    expect(api.getHistory.calls[0]?.[2]).toBeInstanceOf(AbortSignal);
  });

  it('STK-04 loads one stock and caches each symbol on its own', async () => {
    const api = createFakeApi();
    api.getStock.implement((symbol) => Promise.resolve(symbol === 'AAPL' ? aapl : brkb));
    const { wrapper } = createQueryWrapper(api);

    const first = renderHook(() => useStock('AAPL'), { wrapper });
    const second = renderHook(() => useStock('BRK.B'), { wrapper });

    await waitFor(() => {
      expect(first.result.current.data?.symbol).toBe('AAPL');
      expect(second.result.current.data?.symbol).toBe('BRK.B');
    });
    expect(api.getStock.calls).toHaveLength(2);
  });

  it('STK-05 caches history per symbol and period', async () => {
    const api = createFakeApi();
    api.getHistory.implement((symbol, range) =>
      Promise.resolve({
        ...aaplHistory,
        symbol,
        period: typeof range === 'string' ? range : 'custom',
      }),
    );
    const { wrapper } = createQueryWrapper(api);

    const { result, rerender } = renderHook(
      ({ period }: { period: '1W' | '1M' }) => useHistory('AAPL', period),
      { wrapper, initialProps: { period: '1W' } },
    );
    await waitFor(() => {
      expect(result.current.data?.period).toBe('1W');
    });

    rerender({ period: '1M' });
    expect(result.current.data).toBeUndefined();
    await waitFor(() => {
      expect(result.current.data?.period).toBe('1M');
    });

    rerender({ period: '1W' });
    expect(result.current.data?.period).toBe('1W');
    expect(api.getHistory.calls).toHaveLength(2);
  });

  it('STK-06 shares one request between two consumers of the list', async () => {
    const api = createFakeApi();
    api.listStocks.resolves(stocksPage([aapl]));
    const { wrapper } = createQueryWrapper(api);

    const first = renderHook(() => useStocksPages(), { wrapper });
    const second = renderHook(() => useStocksPages(), { wrapper });
    await waitFor(() => {
      expect(first.result.current.data).toBeDefined();
      expect(second.result.current.data).toBeDefined();
    });
    expect(api.listStocks.calls).toHaveLength(1);
  });

  it('STK-07 invalidating a stock refetches its history too and leaves other symbols alone', async () => {
    const api = createFakeApi();
    api.getStock.implement((symbol) => Promise.resolve(symbol === 'AAPL' ? aapl : brkb));
    api.getHistory.resolves(aaplHistory);
    const { wrapper, queryClient } = createQueryWrapper(api);

    const { result } = renderHook(
      () => ({
        stock: useStock('AAPL'),
        history: useHistory('AAPL', '1W'),
        other: useStock('BRK.B'),
      }),
      { wrapper },
    );
    await waitFor(() => {
      expect(result.current.stock.isSuccess).toBe(true);
      expect(result.current.history.isSuccess).toBe(true);
      expect(result.current.other.isSuccess).toBe(true);
    });

    await queryClient.invalidateQueries({ queryKey: queryKeys.stock('AAPL') });

    await waitFor(() => {
      expect(api.getStock.calls).toHaveLength(3);
      expect(api.getHistory.calls).toHaveLength(2);
    });
    expect(api.getStock.calls.filter(([symbol]) => symbol === 'BRK.B')).toHaveLength(1);
  });

  it('STK-12 asks for the first page with a limit, then the next by cursor', async () => {
    const api = createFakeApi();
    api.listStocks
      .resolvesOnce(stocksPage([aapl], 'AAPL', 2))
      .resolvesOnce(stocksPage([brkb], null, 2));
    const { wrapper } = createQueryWrapper(api);
    const { result } = renderHook(() => useStocksPages(), { wrapper });
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(api.listStocks.calls[0]?.[0]).toEqual({ limit: 10 });

    act(() => {
      void result.current.fetchNextPage();
    });

    await waitFor(() => {
      expect(result.current.data?.pages.flatMap((page) => page.stocks)).toEqual([aapl, brkb]);
    });
    expect(api.listStocks.calls[1]?.[0]).toEqual({ limit: 10, cursor: 'AAPL' });
  });

  it('STK-13 has no next page when the cursor is null', async () => {
    const api = createFakeApi();
    api.listStocks.resolves(stocksPage([aapl], null, 1));
    const { wrapper } = createQueryWrapper(api);
    const { result } = renderHook(() => useStocksPages(), { wrapper });
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(result.current.hasNextPage).toBe(false);
  });

  it('STK-14 filters by symbols with one request and no limit', async () => {
    const api = createFakeApi();
    api.listStocks.resolves(stocksPage([aapl, brkb]));
    const { wrapper } = createQueryWrapper(api);
    const { result } = renderHook(() => useStocksBySymbols(['AAPL', 'BRK.B']), { wrapper });

    await waitFor(() => {
      expect(result.current.data?.stocks).toEqual([aapl, brkb]);
    });
    expect(api.listStocks.calls).toHaveLength(1);
    expect(api.listStocks.calls[0]?.[0]).toEqual({ symbols: ['AAPL', 'BRK.B'] });
  });

  it.each([
    ['undefined', undefined],
    ['an empty list', []],
  ])('STK-15 asks for nothing with %s', async (_label, symbols) => {
    const api = createFakeApi();
    const { wrapper } = createQueryWrapper(api);
    const { result } = renderHook(() => useStocksBySymbols(symbols), { wrapper });
    await act(async () => {
      await Promise.resolve();
    });
    expect(api.listStocks.calls).toHaveLength(0);
    expect(result.current.fetchStatus).toBe('idle');
  });

  it('STK-16 caches filtered lists per set of symbols, whatever the order', async () => {
    const api = createFakeApi();
    api.listStocks.resolves(stocksPage([aapl]));
    const { wrapper } = createQueryWrapper(api);
    const { result, rerender } = renderHook(
      ({ symbols }: { symbols: string[] }) => useStocksBySymbols(symbols),
      { wrapper, initialProps: { symbols: ['AAPL', 'BRK.B'] } },
    );
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    rerender({ symbols: ['BRK.B', 'AAPL'] });
    expect(result.current.isSuccess).toBe(true);
    expect(api.listStocks.calls).toHaveLength(1);

    rerender({ symbols: ['AAPL', 'MSFT'] });
    await waitFor(() => {
      expect(api.listStocks.calls).toHaveLength(2);
    });
  });
});

describe('stock list sources', () => {
  it('STK-17 asks for nothing when the paged list is disabled', async () => {
    const api = createFakeApi();
    const { wrapper } = createQueryWrapper(api);
    const { result } = renderHook(() => useStocksPages(false), { wrapper });
    await act(async () => {
      await Promise.resolve();
    });
    expect(api.listStocks.calls).toHaveLength(0);
    expect(result.current.fetchStatus).toBe('idle');
  });

  it('STK-18 keeps the previous rows while a changed filter loads', async () => {
    const api = createFakeApi();
    let release: () => void = () => undefined;
    api.listStocks.implement(({ symbols }) =>
      symbols?.includes('BRK.B')
        ? new Promise((done) => {
            release = () => {
              done(stocksPage([aapl, brkb]));
            };
          })
        : Promise.resolve(stocksPage([aapl])),
    );
    const { wrapper } = createQueryWrapper(api);
    const { result, rerender } = renderHook(
      ({ symbols }: { symbols: string[] }) => useStocksBySymbols(symbols),
      { wrapper, initialProps: { symbols: ['AAPL'] } },
    );
    await waitFor(() => {
      expect(result.current.data?.stocks).toEqual([aapl]);
    });

    rerender({ symbols: ['AAPL', 'BRK.B'] });
    expect(result.current.data?.stocks).toEqual([aapl]);
    expect(result.current.isPlaceholderData).toBe(true);

    await act(async () => {
      release();
      await Promise.resolve();
    });
    await waitFor(() => {
      expect(result.current.data?.stocks).toEqual([aapl, brkb]);
    });
  });
});

describe('history for a range', () => {
  it('STK-19 asks for a custom range, and caches it apart from the periods', async () => {
    const api = createFakeApi();
    api.getHistory.implement((symbol, range) =>
      Promise.resolve({
        ...aaplHistory,
        symbol,
        period: typeof range === 'string' ? range : 'custom',
      }),
    );
    const { wrapper } = createQueryWrapper(api);
    const range = { from: 1_000, to: 9_000_000 };
    const { result, rerender } = renderHook(
      ({ value }: { value: '1D' | { from: number; to: number } }) => useHistory('AAPL', value),
      { wrapper, initialProps: { value: range as '1D' | { from: number; to: number } } },
    );
    await waitFor(() => {
      expect(result.current.data?.period).toBe('custom');
    });
    expect(api.getHistory.calls[0]?.[1]).toEqual(range);

    rerender({ value: '1D' });
    await waitFor(() => {
      expect(result.current.data?.period).toBe('1D');
    });

    rerender({ value: range });
    expect(result.current.data?.period).toBe('custom');
    expect(api.getHistory.calls).toHaveLength(2);
  });
});
