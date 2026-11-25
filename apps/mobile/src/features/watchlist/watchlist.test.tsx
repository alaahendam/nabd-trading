import { aapl, brkb, fakeStocksServer, watchlistItem } from '@nabd/testing';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';

import { createTestApp } from '../../test-app';
import { WatchlistToggle } from './watchlist-toggle';
import { WatchlistView } from './watchlist-view';

const noop = () => undefined;
const star = (symbol = 'AAPL') => screen.getByRole('button', { name: `Watch ${symbol}` });
const never = () => new Promise<never>(() => undefined);

describe('WatchlistToggle', () => {
  it('WLT-01 is named "Watch AAPL" in both states, and announces when it is selected', async () => {
    const app = createTestApp();
    app.api.listWatchlist.resolves([watchlistItem]);

    await app.render(
      <>
        <WatchlistToggle symbol="AAPL" />
        <WatchlistToggle symbol="BRK.B" />
      </>,
    );

    await waitFor(() => {
      expect(star('AAPL')).toBeSelected();
    });
    expect(star('BRK.B')).not.toBeSelected();
  });

  it('WLT-02 changes at once when pressed and tells the server', async () => {
    const app = createTestApp();
    app.api.listWatchlist.resolves([]);
    app.api.addToWatchlist.implement(never);
    await app.render(<WatchlistToggle symbol="AAPL" />);
    await waitFor(() => {
      expect(star()).toBeEnabled();
    });

    await fireEvent.press(star());

    await waitFor(() => {
      expect(star()).toBeSelected();
    });
    expect(app.api.addToWatchlist.calls.map(([symbol]) => symbol)).toEqual(['AAPL']);
  });

  it('WLT-03 goes back and says so when the server refuses', async () => {
    const app = createTestApp();
    app.api.listWatchlist.resolves([]);
    app.api.addToWatchlist.rejects(new Error('refused'));
    await app.render(<WatchlistToggle symbol="AAPL" />);
    await waitFor(() => {
      expect(star()).toBeEnabled();
    });

    await fireEvent.press(star());

    expect(await screen.findByText('Could not update your watchlist')).toBeOnTheScreen();
    expect(star()).not.toBeSelected();
  });

  it('WLT-04 cannot be used while the watchlist is still loading', async () => {
    const app = createTestApp();
    app.api.listWatchlist.implement(never);

    await app.render(<WatchlistToggle symbol="AAPL" />);

    expect(star()).toBeDisabled();
  });

  it('removes a watched stock when pressed', async () => {
    const app = createTestApp();
    app.api.listWatchlist.resolves([watchlistItem]);
    app.api.removeFromWatchlist.implement(never);
    await app.render(<WatchlistToggle symbol="AAPL" />);
    await waitFor(() => {
      expect(star()).toBeSelected();
    });

    await fireEvent.press(star());

    await waitFor(() => {
      expect(star()).not.toBeSelected();
    });
    expect(app.api.removeFromWatchlist.calls.map(([symbol]) => symbol)).toEqual(['AAPL']);
  });
});

describe('WatchlistView', () => {
  it('WLT-05 shows the empty state, and its action opens the stock list', async () => {
    const app = createTestApp();
    app.api.listWatchlist.resolves([]);
    const opened = { browse: 0 };
    await app.render(
      <WatchlistView
        onOpenStock={noop}
        onBrowse={() => {
          opened.browse += 1;
        }}
      />,
    );

    expect(await screen.findByText('Your watchlist is empty')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Browse stocks' }));

    expect(opened.browse).toBe(1);
  });

  it('WLT-06 shows only watched stocks, and removing one takes it off at once', async () => {
    const app = createTestApp();
    app.api.listWatchlist.resolves([watchlistItem, { symbol: 'BRK.B', addedAt: 1 }]);
    app.api.listStocks.implement(fakeStocksServer([aapl, brkb]));
    app.api.removeFromWatchlist.implement(never);
    await app.render(<WatchlistView onOpenStock={noop} onBrowse={noop} />);
    expect(await screen.findByText('Apple Inc.')).toBeOnTheScreen();
    expect(screen.getByText('Berkshire Hathaway Inc.')).toBeOnTheScreen();

    await fireEvent.press(star('AAPL'));

    await waitFor(() => {
      expect(screen.queryByText('Apple Inc.')).not.toBeOnTheScreen();
    });
    expect(screen.getByText('Berkshire Hathaway Inc.')).toBeOnTheScreen();
  });

  it('WLT-07 shows an error with a retry button when the watchlist cannot be loaded', async () => {
    const app = createTestApp();
    app.api.listWatchlist.rejectsOnce(new Error('offline')).resolves([]);
    await app.render(<WatchlistView onOpenStock={noop} onBrowse={noop} />);

    expect(await screen.findByText('Could not load your watchlist')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Try again' }));

    expect(await screen.findByText('Your watchlist is empty')).toBeOnTheScreen();
  });

  it('WLT-08 shows a busy status while the watchlist loads', async () => {
    const app = createTestApp();
    app.api.listWatchlist.implement(never);

    await app.render(<WatchlistView onOpenStock={noop} onBrowse={noop} />);

    expect(screen.getByRole('progressbar', { name: 'Loading watchlist…' })).toBeOnTheScreen();
  });
});
