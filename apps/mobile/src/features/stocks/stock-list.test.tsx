import type { StockWithQuote } from '@nabd/shared';
import { aapl, type createFakeApi, fakeStocksServer, stocksPage } from '@nabd/testing';
import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';

import { createTestApp } from '../../test-app';
import { StockList } from './stock-list';

/** `count` stocks with the symbols SA, SB, SC, ... in list order. */
function makeStocks(count: number): StockWithQuote[] {
  return Array.from({ length: count }, (_unused, index) => {
    const symbol = `S${String.fromCharCode(65 + index)}`;
    return { ...aapl, symbol, name: `${symbol} Corp.`, quote: { ...aapl.quote, symbol } };
  });
}

const noop = () => undefined;
const list = () => screen.getByTestId('stock-list');

type Api = ReturnType<typeof createFakeApi>;

/** The first page loads and the connection is live. */
async function openLoadedList(app: ReturnType<typeof createTestApp>, stocks: StockWithQuote[]) {
  app.api.listStocks.implement(fakeStocksServer(stocks));
  await app.render(<StockList onOpenStock={noop} />);
  await app.connect();
  await screen.findByText('SA Corp.');
}

const requestedCursors = (api: Api) => api.listStocks.calls.map(([query]) => query.cursor);

describe('StockList', () => {
  it('LST-01 shows a busy status with skeleton rows while the first page loads', async () => {
    const app = createTestApp();
    app.api.listStocks.implement(() => new Promise(() => undefined));

    await app.render(<StockList onOpenStock={noop} />);

    expect(screen.getByRole('progressbar', { name: 'Loading stocks…' })).toBeOnTheScreen();
  });

  it('LST-02 shows an error with a retry button when the first load fails', async () => {
    const app = createTestApp();
    app.api.listStocks.rejectsOnce(new Error('offline')).implement(fakeStocksServer(makeStocks(2)));
    await app.render(<StockList onOpenStock={noop} />);

    expect(await screen.findByText('Could not load stocks')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Try again' }));

    expect(await screen.findByText('SA Corp.')).toBeOnTheScreen();
  });

  it('LST-03 shows the empty message for an empty answer', async () => {
    const app = createTestApp();
    app.api.listStocks.resolves(stocksPage([]));

    await app.render(<StockList onOpenStock={noop} />);

    expect(await screen.findByText('No stocks to show')).toBeOnTheScreen();
  });

  it('LST-04 shows the count and the rows of a loaded list', async () => {
    const app = createTestApp();

    await openLoadedList(app, makeStocks(3));

    expect(screen.getByText('3 stocks')).toBeOnTheScreen();
    expect(screen.getByText('SB Corp.')).toBeOnTheScreen();
    expect(screen.getByText('SC Corp.')).toBeOnTheScreen();
  });

  it('LST-05 subscribes only the rows that are loaded', async () => {
    const app = createTestApp();

    await openLoadedList(app, makeStocks(40));
    await act(() => Promise.resolve());

    const asked = app.socket.calls.subscribe.flat();
    expect(asked.length).toBe(10 * app.api.listStocks.calls.length);
    expect(asked.length).toBeLessThan(40);
    expect(asked).toContain('SJ');
  });

  it('LST-06 loads the next page when the end is reached, once, while there is one', async () => {
    const app = createTestApp();
    await openLoadedList(app, makeStocks(12));

    await fireEvent(list(), 'endReached');
    await fireEvent(list(), 'endReached');
    await waitFor(() => {
      expect(screen.getByText('12 stocks')).toBeOnTheScreen();
    });
    await waitFor(() => {
      expect(requestedCursors(app.api)).toEqual([undefined, 'SJ']);
    });
    await fireEvent(list(), 'endReached');

    expect(requestedCursors(app.api)).toEqual([undefined, 'SJ']);
  });

  it('LST-07 shows a message and a retry button after a failed page, and does not retry by itself', async () => {
    const app = createTestApp();
    const server = fakeStocksServer(makeStocks(40));
    app.api.listStocks.implementOnce(server).rejectsOnce(new Error('offline')).implement(server);
    await app.render(<StockList onOpenStock={noop} />);

    expect(await screen.findByText('Could not load more stocks')).toBeOnTheScreen();
    await act(() => Promise.resolve());
    expect(app.api.listStocks.calls).toHaveLength(2);
    await fireEvent.press(screen.getByRole('button', { name: 'Try again' }));

    await waitFor(() => {
      expect(screen.queryByText('Could not load more stocks')).not.toBeOnTheScreen();
    });
    expect(app.api.listStocks.calls.length).toBeGreaterThanOrEqual(3);
  });

  it('LST-08 reloads the list when pulled to refresh', async () => {
    const app = createTestApp();
    await openLoadedList(app, makeStocks(3));
    expect(app.api.listStocks.calls).toHaveLength(1);

    await fireEvent(list(), 'refresh');

    await waitFor(() => {
      expect(app.api.listStocks.calls).toHaveLength(2);
    });
  });

  it('LST-09 keeps showing the rows when a refresh fails after data arrived', async () => {
    const app = createTestApp();
    await openLoadedList(app, makeStocks(3));
    app.api.listStocks.rejects(new Error('offline'));

    await act(async () => {
      await app.queryClient.refetchQueries();
    });

    expect(screen.getByText('SA Corp.')).toBeOnTheScreen();
    expect(screen.queryByText('Could not load stocks')).not.toBeOnTheScreen();
  });

  it('LST-10 shows no loading-more line on the last page', async () => {
    const app = createTestApp();

    await openLoadedList(app, makeStocks(3));

    expect(screen.queryByText('Loading…')).not.toBeOnTheScreen();
    expect(screen.queryByText('Could not load more stocks')).not.toBeOnTheScreen();
  });

  it('shows only the given symbols, in one request, when symbols are passed', async () => {
    const app = createTestApp();
    app.api.listStocks.implement(fakeStocksServer(makeStocks(5)));

    await app.render(<StockList symbols={['SB', 'SD']} onOpenStock={noop} />);

    expect(await screen.findByText('SB Corp.')).toBeOnTheScreen();
    expect(screen.getByText('SD Corp.')).toBeOnTheScreen();
    expect(screen.queryByText('SA Corp.')).not.toBeOnTheScreen();
    expect(app.api.listStocks.calls).toEqual([[{ symbols: ['SB', 'SD'] }, expect.anything()]]);
  });
});
