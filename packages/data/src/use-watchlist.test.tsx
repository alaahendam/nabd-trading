// @vitest-environment jsdom
import { ApiClientError } from '@nabd/api-client';
import type { WatchlistItem } from '@nabd/shared';
import { createFakeApi } from '@nabd/testing';
import { watchlistItem } from '@nabd/testing';
import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { queryKeys } from './query-keys.js';
import { createQueryWrapper } from './test-wrapper.js';
import { useWatchlist, useWatchlistToggle } from './use-watchlist.js';

const msft: WatchlistItem = { symbol: 'MSFT', addedAt: 1_700_000_100_000 };

const deferred = <T,>() => {
  let resolve: (value: T) => void = () => undefined;
  let reject: (error: Error) => void = () => undefined;
  const promise = new Promise<T>((done, fail) => {
    resolve = done;
    reject = fail;
  });
  return { promise, resolve, reject };
};

const setup = (initial: WatchlistItem[] = [watchlistItem]) => {
  const api = createFakeApi();
  api.listWatchlist.resolves(initial);
  const { wrapper, queryClient } = createQueryWrapper(api);
  const view = renderHook(() => ({ list: useWatchlist(), toggle: useWatchlistToggle() }), {
    wrapper,
  });
  const cached = () => queryClient.getQueryData<WatchlistItem[]>(queryKeys.watchlist());
  return { api, queryClient, cached, ...view };
};

describe('useWatchlist', () => {
  it('WLH-01 loads the list and passes the abort signal on', async () => {
    const { api, result } = setup();
    expect(result.current.list.isPending).toBe(true);
    await waitFor(() => {
      expect(result.current.list.data).toEqual([watchlistItem]);
    });
    expect(api.listWatchlist.calls[0]?.[0]).toBeInstanceOf(AbortSignal);
  });

  it('WLH-02 reports a failure without retrying a permanent error', async () => {
    const api = createFakeApi();
    api.listWatchlist.rejects(new ApiClientError({ kind: 'http', status: 404, message: 'x' }));
    const { wrapper } = createQueryWrapper(api);
    const { result } = renderHook(() => useWatchlist(), { wrapper });
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
    expect(api.listWatchlist.calls).toHaveLength(1);
  });
});

describe('useWatchlistToggle', () => {
  it('WLH-03 adds optimistically, then fetches the list again', async () => {
    const { api, result, cached } = setup();
    await waitFor(() => {
      expect(result.current.list.isSuccess).toBe(true);
    });
    const server = deferred<WatchlistItem>();
    api.addToWatchlist.returns(server.promise);
    api.listWatchlist.resolves([watchlistItem, msft]);

    act(() => {
      result.current.toggle.mutate({ symbol: 'MSFT', watch: true });
    });
    await waitFor(() => {
      expect(cached()?.map((item) => item.symbol)).toEqual(['AAPL', 'MSFT']);
    });
    expect(api.listWatchlist.calls).toHaveLength(1);

    await act(async () => {
      server.resolve(msft);
      await Promise.resolve();
    });
    await waitFor(() => {
      expect(api.listWatchlist.calls).toHaveLength(2);
    });
    expect(api.addToWatchlist.calls).toContainEqual(['MSFT']);
  });

  it('WLH-04 removes optimistically, then fetches the list again', async () => {
    const { api, result, cached } = setup();
    await waitFor(() => {
      expect(result.current.list.isSuccess).toBe(true);
    });
    const server = deferred<undefined>();
    api.removeFromWatchlist.returns(server.promise);
    api.listWatchlist.resolves([]);

    act(() => {
      result.current.toggle.mutate({ symbol: 'AAPL', watch: false });
    });
    await waitFor(() => {
      expect(cached()).toEqual([]);
    });

    await act(async () => {
      server.resolve(undefined);
      await Promise.resolve();
    });
    await waitFor(() => {
      expect(api.listWatchlist.calls).toHaveLength(2);
    });
  });

  it('WLH-05 rolls a failed add back and reports the error', async () => {
    const { api, result, cached } = setup();
    await waitFor(() => {
      expect(result.current.list.isSuccess).toBe(true);
    });
    const failure = new ApiClientError({ kind: 'http', status: 404, message: 'No stock' });
    api.addToWatchlist.rejects(failure);

    await act(async () => {
      result.current.toggle.mutate({ symbol: 'MSFT', watch: true });
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(result.current.toggle.error).toBe(failure);
    });
    expect(cached()).toEqual([watchlistItem]);
    await waitFor(() => {
      expect(api.listWatchlist.calls).toHaveLength(2);
    });
  });

  it('WLH-06 rolls a failed remove back', async () => {
    const { api, result, cached } = setup();
    await waitFor(() => {
      expect(result.current.list.isSuccess).toBe(true);
    });
    api.removeFromWatchlist.rejects(
      new ApiClientError({ kind: 'http', status: 400, message: 'bad' }),
    );

    await act(async () => {
      result.current.toggle.mutate({ symbol: 'AAPL', watch: false });
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(result.current.toggle.isError).toBe(true);
    });
    expect(cached()).toEqual([watchlistItem]);
  });

  it('WLH-07 does not duplicate a symbol that is already there', async () => {
    const { api, result, cached } = setup();
    await waitFor(() => {
      expect(result.current.list.isSuccess).toBe(true);
    });
    api.addToWatchlist.returns(new Promise(() => undefined));

    act(() => {
      result.current.toggle.mutate({ symbol: 'AAPL', watch: true });
    });
    await waitFor(() => {
      expect(api.addToWatchlist.calls).toHaveLength(1);
    });
    expect(cached()).toEqual([watchlistItem]);
  });

  it('WLH-08 cancels a list fetch that is running when the toggle starts', async () => {
    const api = createFakeApi();
    let signal: AbortSignal | undefined;
    api.listWatchlist.implement((given) => {
      signal = given;
      return new Promise(() => undefined);
    });
    api.addToWatchlist.returns(new Promise(() => undefined));
    const { wrapper } = createQueryWrapper(api);
    const { result } = renderHook(() => ({ list: useWatchlist(), toggle: useWatchlistToggle() }), {
      wrapper,
    });
    await waitFor(() => {
      expect(signal).toBeDefined();
    });

    act(() => {
      result.current.toggle.mutate({ symbol: 'AAPL', watch: true });
    });

    await waitFor(() => {
      expect(signal?.aborted).toBe(true);
    });
  });

  it('WLH-09 leaves the cache empty on rollback when the list never loaded, and fetches again', async () => {
    const api = createFakeApi();
    api.listWatchlist
      .rejectsOnce(new ApiClientError({ kind: 'http', status: 400, message: 'x' }))
      .resolves([watchlistItem]);
    api.addToWatchlist.rejects(new ApiClientError({ kind: 'http', status: 400, message: 'x' }));
    const { wrapper, queryClient } = createQueryWrapper(api);
    const { result } = renderHook(() => ({ list: useWatchlist(), toggle: useWatchlistToggle() }), {
      wrapper,
    });
    await waitFor(() => {
      expect(result.current.list.isError).toBe(true);
    });

    await act(async () => {
      result.current.toggle.mutate({ symbol: 'MSFT', watch: true });
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(api.listWatchlist.calls).toHaveLength(2);
    });
    await waitFor(() => {
      expect(queryClient.getQueryData(queryKeys.watchlist())).toEqual([watchlistItem]);
    });
  });

  it('WLH-11 still reports the error and fetches again when the optimistic update cannot start', async () => {
    const { api, result, queryClient } = setup();
    await waitFor(() => {
      expect(result.current.list.isSuccess).toBe(true);
    });
    vi.spyOn(queryClient, 'cancelQueries').mockRejectedValue(new Error('cannot cancel'));

    await act(async () => {
      result.current.toggle.mutate({ symbol: 'MSFT', watch: true });
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(result.current.toggle.isError).toBe(true);
    });
    expect(api.addToWatchlist.calls).toHaveLength(0);
    await waitFor(() => {
      expect(api.listWatchlist.calls).toHaveLength(2);
    });
  });

  it('WLH-10 does not retry a write', async () => {
    const { api, result } = setup();
    await waitFor(() => {
      expect(result.current.list.isSuccess).toBe(true);
    });
    api.removeFromWatchlist.rejects(
      new ApiClientError({ kind: 'http', status: 503, message: 'down' }),
    );

    await act(async () => {
      result.current.toggle.mutate({ symbol: 'AAPL', watch: false });
      await Promise.resolve();
    });
    await waitFor(() => {
      expect(result.current.toggle.isError).toBe(true);
    });
    expect(api.removeFromWatchlist.calls).toHaveLength(1);
  });
});
