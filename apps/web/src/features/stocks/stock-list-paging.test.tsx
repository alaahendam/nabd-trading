import type { StockWithQuote } from '@nabd/shared';
import { aapl, fakeStocksServer } from '@nabd/testing';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ApiClientError } from '../../lib/api';
import { installFakeIntersectionObserver } from '../../test/fake-intersection-observer';
import { createFeatureHarness } from '../../test/feature-harness';
import { StockList } from './stock-list';

const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
/** 21 stocks, A to U, so ten per page makes three pages. */
const stocks: StockWithQuote[] = Array.from({ length: 21 }, (_unused, index) => {
  const symbol = letters.charAt(index);
  return { ...aapl, symbol, name: `Company ${symbol}`, quote: { ...aapl.quote, symbol } };
});

const loadMoreButton = () => screen.getByRole('button', { name: 'Load more stocks' });
const rows = () => screen.queryAllByRole('listitem');

function renderList(props: { symbols?: readonly string[] } = {}) {
  const harness = createFeatureHarness();
  harness.api.listStocks.implement(fakeStocksServer(stocks));
  const view = render(<StockList {...props} />, { wrapper: harness.Wrapper });
  return { ...harness, ...view };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('StockList paging', () => {
  it('LST-16 loads the first page and shows the total', async () => {
    const { api } = renderList();
    expect(await screen.findByText('21 stocks')).toBeInTheDocument();
    expect(api.listStocks.calls[0]?.[0]).toEqual({ limit: 10 });
    expect(rows()).toHaveLength(10);
  });

  it('LST-17 loads the next page from the button, until the end', async () => {
    const { api } = renderList();
    await screen.findByText('21 stocks');

    await userEvent.click(loadMoreButton());
    await vi.waitFor(() => {
      expect(rows()).toHaveLength(20);
    });
    expect(api.listStocks.calls[1]?.[0]).toEqual({ limit: 10, cursor: 'J' });

    await userEvent.click(loadMoreButton());
    await vi.waitFor(() => {
      expect(rows()).toHaveLength(21);
    });
    expect(api.listStocks.calls[2]?.[0]).toEqual({ limit: 10, cursor: 'T' });
    expect(screen.queryByRole('button', { name: 'Load more stocks' })).not.toBeInTheDocument();
  });

  it('LST-18 loads the next page when the button scrolls into view', async () => {
    const observers = installFakeIntersectionObserver();
    const { api } = renderList();
    await screen.findByText('21 stocks');
    expect(observers.live()).toHaveLength(1);

    act(() => {
      observers.live()[0]?.report(false);
    });
    expect(api.listStocks.calls).toHaveLength(1);

    act(() => {
      observers.live()[0]?.report(true);
    });
    await vi.waitFor(() => {
      expect(rows()).toHaveLength(20);
    });
    expect(api.listStocks.calls).toHaveLength(2);

    act(() => {
      observers.live()[0]?.report(true);
    });
    await vi.waitFor(() => {
      expect(rows()).toHaveLength(21);
    });
    expect(api.listStocks.calls).toHaveLength(3);
    expect(observers.live()).toHaveLength(0);
  });

  it('LST-19 shows that the next page is loading', async () => {
    const { api } = renderList();
    await screen.findByText('21 stocks');
    api.listStocks.returns(new Promise(() => undefined));

    await userEvent.click(loadMoreButton());

    const busy = await screen.findByRole('button', { name: 'Loading…' });
    expect(busy).toBeDisabled();
    expect(busy).toHaveAttribute('aria-busy', 'true');
  });

  it('LST-20 keeps the rows when the next page fails, and retries', async () => {
    const { api } = renderList();
    await screen.findByText('21 stocks');
    api.listStocks.rejectsOnce(new ApiClientError({ kind: 'http', status: 400, message: 'bad' }));

    await userEvent.click(loadMoreButton());

    expect(await screen.findByRole('alert')).toHaveTextContent('Could not load more stocks');
    expect(rows()).toHaveLength(10);
    api.listStocks.implement(fakeStocksServer(stocks));
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    await vi.waitFor(() => {
      expect(rows()).toHaveLength(20);
    });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('LST-21 does not page a filtered list', async () => {
    const { api } = renderList({ symbols: ['A', 'B'] });
    await vi.waitFor(() => {
      expect(rows()).toHaveLength(2);
    });
    expect(api.listStocks.calls[0]?.[0]).toEqual({ symbols: ['A', 'B'] });
    expect(screen.queryByRole('button', { name: 'Load more stocks' })).not.toBeInTheDocument();
    expect(screen.getByText('2 stocks')).toBeInTheDocument();
  });

  it('LST-22 asks for nothing when the filter is empty', async () => {
    const { api } = renderList({ symbols: [] });
    expect(await screen.findByText('No stocks to show')).toBeInTheDocument();
    expect(api.listStocks.calls).toHaveLength(0);
  });

  it('LST-23 subscribes to the rows of every loaded page', async () => {
    const { connect, socket } = renderList();
    await screen.findByText('21 stocks');
    connect();
    await act(async () => {
      await Promise.resolve();
    });
    expect(socket.calls.subscribe).toEqual([['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J']]);

    await userEvent.click(loadMoreButton());
    await vi.waitFor(() => {
      expect(rows()).toHaveLength(20);
    });
    await act(async () => {
      await Promise.resolve();
    });
    expect(socket.calls.subscribe.flat()).toContain('T');
    expect(socket.calls.subscribe.flat()).toContain('K');
  });
});

describe('StockList filtered retry', () => {
  it('LST-24 retries a failed filtered list', async () => {
    const harness = createFeatureHarness();
    harness.api.listStocks
      .rejectsOnce(new ApiClientError({ kind: 'http', status: 400, message: 'bad' }))
      .implement(fakeStocksServer(stocks));
    render(<StockList symbols={['A', 'B']} />, { wrapper: harness.Wrapper });

    expect(await screen.findByRole('alert')).toHaveTextContent('Could not load stocks');
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));

    await vi.waitFor(() => {
      expect(rows()).toHaveLength(2);
    });
    expect(harness.api.listStocks.calls).toHaveLength(2);
  });
});
