import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ApiClientError } from '../../lib/api';
import { queryKeys } from '../../lib/query';
import { createFakeApi } from '../../test/fake-api';
import { aapl, aaplHistory, brkb } from '../../test/fixtures';
import { createQueryWrapper } from '../../test/query-wrapper';
import { useHistory, useStock, useStocks } from './stock-queries';

describe('stock queries', () => {
  it('STK-01 loads the stock list', async () => {
    const api = createFakeApi();
    api.listStocks.mockResolvedValue([aapl, brkb]);
    const { wrapper } = createQueryWrapper(api);

    const { result } = renderHook(() => useStocks(), { wrapper });
    expect(result.current.isPending).toBe(true);

    await waitFor(() => {
      expect(result.current.data).toEqual([aapl, brkb]);
    });
    expect(api.listStocks).toHaveBeenCalledTimes(1);
  });

  it('STK-02 reports a failure without retrying a permanent error', async () => {
    const api = createFakeApi();
    const error = new ApiClientError({ kind: 'http', status: 404, message: 'nope' });
    api.listStocks.mockRejectedValue(error);
    const { wrapper } = createQueryWrapper(api);

    const { result } = renderHook(() => useStocks(), { wrapper });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
    expect(result.current.error).toBe(error);
    expect(api.listStocks).toHaveBeenCalledTimes(1);
  });

  it('STK-03 passes the abort signal on, in all three hooks', async () => {
    const api = createFakeApi();
    api.listStocks.mockResolvedValue([aapl]);
    api.getStock.mockResolvedValue(aapl);
    api.getHistory.mockResolvedValue(aaplHistory);
    const { wrapper } = createQueryWrapper(api);

    const { result } = renderHook(
      () => ({ list: useStocks(), one: useStock('AAPL'), history: useHistory('AAPL', '1W') }),
      { wrapper },
    );
    await waitFor(() => {
      expect(result.current.history.isSuccess).toBe(true);
      expect(result.current.one.isSuccess).toBe(true);
      expect(result.current.list.isSuccess).toBe(true);
    });

    expect(api.listStocks.mock.calls[0]?.[0]).toBeInstanceOf(AbortSignal);
    expect(api.getStock.mock.calls[0]?.[1]).toBeInstanceOf(AbortSignal);
    expect(api.getHistory.mock.calls[0]?.[2]).toBeInstanceOf(AbortSignal);
  });

  it('STK-04 loads one stock and caches each symbol on its own', async () => {
    const api = createFakeApi();
    api.getStock.mockImplementation((symbol) => Promise.resolve(symbol === 'AAPL' ? aapl : brkb));
    const { wrapper } = createQueryWrapper(api);

    const first = renderHook(() => useStock('AAPL'), { wrapper });
    const second = renderHook(() => useStock('BRK.B'), { wrapper });

    await waitFor(() => {
      expect(first.result.current.data?.symbol).toBe('AAPL');
      expect(second.result.current.data?.symbol).toBe('BRK.B');
    });
    expect(api.getStock).toHaveBeenCalledTimes(2);
  });

  it('STK-05 caches history per symbol and period', async () => {
    const api = createFakeApi();
    api.getHistory.mockImplementation((symbol, period) =>
      Promise.resolve({ ...aaplHistory, symbol, period }),
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
    expect(api.getHistory).toHaveBeenCalledTimes(2);
  });

  it('STK-06 shares one request between two consumers of the list', async () => {
    const api = createFakeApi();
    api.listStocks.mockResolvedValue([aapl]);
    const { wrapper } = createQueryWrapper(api);

    const first = renderHook(() => useStocks(), { wrapper });
    const second = renderHook(() => useStocks(), { wrapper });
    await waitFor(() => {
      expect(first.result.current.data).toBeDefined();
      expect(second.result.current.data).toBeDefined();
    });
    expect(api.listStocks).toHaveBeenCalledTimes(1);
  });

  it('STK-07 invalidating a stock refetches its history too and leaves other symbols alone', async () => {
    const api = createFakeApi();
    api.getStock.mockImplementation((symbol) => Promise.resolve(symbol === 'AAPL' ? aapl : brkb));
    api.getHistory.mockResolvedValue(aaplHistory);
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
      expect(api.getStock).toHaveBeenCalledTimes(3);
      expect(api.getHistory).toHaveBeenCalledTimes(2);
    });
    expect(api.getStock.mock.calls.filter(([symbol]) => symbol === 'BRK.B')).toHaveLength(1);
  });
});
