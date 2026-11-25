import { ApiClientError } from '@nabd/api-client';
import type { StockWithQuote } from '@nabd/shared';
import { aapl, brkb, fakeStocksServer } from '@nabd/testing';
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createFeatureHarness } from '../../test/feature-harness';
import { StockList } from './stock-list';

const msft: StockWithQuote = {
  ...aapl,
  symbol: 'MSFT',
  name: 'Microsoft Corporation',
  quote: {
    ...aapl.quote,
    symbol: 'MSFT',
    price: 400,
    previousClose: 398,
    open: 399,
    high: 401,
    low: 397,
    change: 2,
    changePercent: 0.5,
  },
};

const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const many = (count: number): StockWithQuote[] =>
  Array.from({ length: count }, (_unused, index) => {
    const symbol = letters.charAt(index);
    return { ...aapl, symbol, name: `Company ${symbol}`, quote: { ...aapl.quote, symbol } };
  });

const rowOf = (symbol: string) => {
  const item = screen.getAllByRole('listitem').find((row) => within(row).queryByText(symbol));
  if (!item) {
    throw new Error(`No row for ${symbol}`);
  }
  return item;
};

afterEach(() => {
  vi.useRealTimers();
});

describe('StockList', () => {
  it('LST-01 shows a busy loading status with skeleton rows', () => {
    const harness = createFeatureHarness();
    harness.api.listStocks.returns(new Promise(() => undefined));
    render(<StockList />, { wrapper: harness.Wrapper });
    const status = screen.getByRole('status', { name: 'Loading stocks…' });
    expect(status).toHaveAttribute('aria-busy', 'true');
    expect(screen.queryAllByRole('listitem')).toHaveLength(0);
  });

  it('LST-02 renders a row per stock from its quote', async () => {
    const { api } = renderFeatureWith([aapl, msft]);
    expect(await screen.findByText('Apple Inc.')).toBeInTheDocument();
    expect(api.listStocks.calls).toHaveLength(1);

    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    const apple = within(rowOf('AAPL'));
    expect(apple.getByText('Apple Inc.')).toBeInTheDocument();
    expect(apple.getByText('$230.00')).toBeInTheDocument();
    expect(apple.getByText('+$2.00 (+0.88%)')).toBeInTheDocument();
    const microsoft = within(rowOf('MSFT'));
    expect(microsoft.getByText('$400.00')).toBeInTheDocument();
    expect(microsoft.getByText('+$2.00 (+0.50%)')).toBeInTheDocument();
  });

  it('LST-03 shows a live price and its change, and leaves other rows alone', async () => {
    const { connect, tick } = renderFeatureWith([aapl, msft]);
    await screen.findByText('Apple Inc.');
    connect();
    tick([{ symbol: 'AAPL', price: 235 }]);

    const apple = within(rowOf('AAPL'));
    expect(apple.getByText('$235.00')).toBeInTheDocument();
    expect(apple.getByText('+$7.00 (+3.07%)')).toBeInTheDocument();
    expect(within(rowOf('MSFT')).getByText('$400.00')).toBeInTheDocument();
  });

  it('LST-04 links each row to its detail page, keeping the dot readable', async () => {
    renderFeatureWith([aapl, brkb]);
    await screen.findByText('Apple Inc.');
    expect(screen.getByRole('link', { name: /AAPL/ })).toHaveAttribute('href', '/stocks/AAPL');
    expect(screen.getByRole('link', { name: /BRK\.B/ })).toHaveAttribute('href', '/stocks/BRK.B');
  });

  it('LST-05 subscribes to what it shows and lets go on unmount', async () => {
    function Screen() {
      const [shown, setShown] = useState(true);
      return (
        <>
          <button
            type="button"
            onClick={() => {
              setShown(false);
            }}
          >
            Hide
          </button>
          {shown ? <StockList /> : null}
        </>
      );
    }
    const harness = createFeatureHarness();
    harness.api.listStocks.implement(fakeStocksServer([aapl, msft]));
    render(<Screen />, { wrapper: harness.Wrapper });
    const { connect, socket } = harness;
    await screen.findByText('Apple Inc.');
    connect();
    await act(async () => {
      await Promise.resolve();
    });
    expect(socket.calls.subscribe).toEqual([['AAPL', 'MSFT']]);

    await userEvent.click(screen.getByRole('button', { name: 'Hide' }));
    await act(async () => {
      await Promise.resolve();
    });
    expect(socket.calls.unsubscribe).toEqual([['AAPL', 'MSFT']]);
  });

  it('LST-06 re-renders only the row whose price ticked', async () => {
    const renderAction = vi.fn((symbol: string) => <span>{`star ${symbol}`}</span>);
    const { connect, tick } = renderFeatureWith([aapl, msft], { renderAction });
    await screen.findByText('Apple Inc.');
    connect();
    renderAction.mockClear();

    tick([{ symbol: 'MSFT', price: 401 }]);

    const calledFor = renderAction.mock.calls.map(([symbol]) => symbol);
    expect(calledFor).toContain('MSFT');
    expect(calledFor).not.toContain('AAPL');
  });

  it('LST-07 marks a price as delayed after ten silent seconds', async () => {
    vi.useFakeTimers({ toFake: ['Date', 'setInterval', 'clearInterval'] });
    const { connect, tick } = renderFeatureWith([aapl]);
    // Wait for the rows themselves. Advancing a few fake milliseconds and hoping the list had
    // loaded passed on a fast machine and failed on a slow CI runner.
    await screen.findByText('Apple Inc.');
    connect();
    tick([{ symbol: 'AAPL', price: 231 }]);
    expect(screen.queryByText('Delayed')).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(11_000);
    });
    expect(screen.getByText('Delayed')).toBeInTheDocument();
  });

  it('LST-08 shows an error with a retry that loads the rows', async () => {
    const { api } = renderFeatureWith([aapl], {
      firstFailure: new ApiClientError({ kind: 'http', status: 404, message: 'x' }),
    });
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not load stocks');
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByText('Apple Inc.')).toBeInTheDocument();
    expect(api.listStocks.calls).toHaveLength(2);
  });

  it('LST-25 isolates the company name, so English keeps its own order inside Arabic', async () => {
    renderFeatureWith([aapl]);
    // Without isolation the full stop of "Apple Inc." moves to the wrong end in a right-to-left page.
    expect((await screen.findByText('Apple Inc.')).tagName).toBe('BDI');
  });

  it('LST-15 keeps the rows when a refresh fails after they loaded', async () => {
    const { api, queryClient } = renderFeatureWith([aapl]);
    await screen.findByText('Apple Inc.');

    api.listStocks.rejectsOnce(new ApiClientError({ kind: 'http', status: 404, message: 'x' }));
    await act(async () => {
      await queryClient.refetchQueries();
    });

    expect(screen.getByText('Apple Inc.')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('LST-09 shows an empty status when there are no stocks', async () => {
    renderFeatureWith([]);
    const message = await screen.findByText('No stocks to show');
    expect(message.closest('[role="status"]')).toBeInTheDocument();
  });

  it('LST-10 shows only the symbols it is given, and subscribes to those only', async () => {
    const { connect, socket } = renderFeatureWith([aapl, msft], { symbols: ['MSFT'] });
    await screen.findByText('Microsoft Corporation');
    expect(screen.queryByText('Apple Inc.')).not.toBeInTheDocument();
    connect();
    await act(async () => {
      await Promise.resolve();
    });
    expect(socket.calls.subscribe).toEqual([['MSFT']]);
  });

  it('LST-10 shows the empty status when no symbol matches', async () => {
    renderFeatureWith([aapl], { symbols: ['ZZZ'] });
    expect(await screen.findByText('No stocks to show')).toBeInTheDocument();
    expect(screen.queryByText('Apple Inc.')).not.toBeInTheDocument();
  });

  it('LST-11 renders the action slot in every row with its symbol', async () => {
    renderFeatureWith([aapl, msft], {
      renderAction: (symbol) => <button type="button">{`Act on ${symbol}`}</button>,
    });
    await screen.findByText('Apple Inc.');
    expect(within(rowOf('AAPL')).getByRole('button', { name: 'Act on AAPL' })).toBeInTheDocument();
    expect(within(rowOf('MSFT')).getByRole('button', { name: 'Act on MSFT' })).toBeInTheDocument();
  });

  it.each([
    [1, '1 stock'],
    [2, '2 stocks'],
    [11, '11 stocks'],
  ])('LST-12 counts %i stocks in English', async (count, text) => {
    renderFeatureWith(many(count));
    expect(await screen.findByText(text)).toBeInTheDocument();
  });

  it.each([
    [2, 'سهمان'],
    [11, '11 سهمًا'],
  ])('LST-12 counts %i stocks in Arabic', async (count, text) => {
    renderFeatureWith(many(count), { language: 'ar' });
    expect(await screen.findByText(text)).toBeInTheDocument();
  });

  it('LST-13 reads in Arabic with Latin figures', async () => {
    renderFeatureWith([aapl], { language: 'ar' });
    await screen.findByText('Apple Inc.');
    const apple = within(rowOf('AAPL'));
    expect(apple.getByText('$230.00')).toHaveClass('numeric');
    expect(apple.getByText('ارتفاع')).toBeInTheDocument();
    expect(apple.getByText('+$2.00 (+0.88%)')).toBeInTheDocument();
  });

  it('LST-14 flashes up and then down on live ticks', async () => {
    const { connect, tick } = renderFeatureWith([aapl]);
    await screen.findByText('Apple Inc.');
    connect();
    tick([{ symbol: 'AAPL', price: 231 }]);
    tick([{ symbol: 'AAPL', price: 232 }]);
    expect(screen.getByText('$232.00')).toHaveAttribute('data-direction', 'up');
    tick([{ symbol: 'AAPL', price: 231 }]);
    expect(screen.getByText('$231.00')).toHaveAttribute('data-direction', 'down');
  });
});

interface Options {
  symbols?: readonly string[];
  renderAction?: (symbol: string) => React.ReactNode;
  language?: 'en' | 'ar';
  firstFailure?: Error;
}

/** Stubs the API first, then renders, because the list asks for its data as it mounts. */
function renderFeatureWith(stocks: StockWithQuote[], options: Options = {}) {
  const { language, firstFailure, ...listProps } = options;
  const harness = createFeatureHarness(language === undefined ? {} : { language });
  if (firstFailure) {
    harness.api.listStocks.rejectsOnce(firstFailure);
  }
  harness.api.listStocks.implement(fakeStocksServer(stocks));
  const view = render(<StockList {...listProps} />, { wrapper: harness.Wrapper });
  return { ...harness, ...view };
}
