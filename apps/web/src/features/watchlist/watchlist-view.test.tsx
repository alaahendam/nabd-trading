import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { ApiClientError } from '../../lib/api';
import { createFeatureHarness } from '../../test/feature-harness';
import { aapl, brkb, watchlistItem } from '../../test/fixtures';
import { WatchlistView } from './watchlist-view';

function renderView() {
  const harness = createFeatureHarness();
  harness.api.listStocks.mockResolvedValue([aapl, brkb]);
  harness.api.removeFromWatchlist.mockResolvedValue(undefined);
  return harness;
}

describe('WatchlistView', () => {
  it('WLV-01 shows a busy loading status', () => {
    const harness = renderView();
    harness.api.listWatchlist.mockReturnValue(new Promise(() => undefined));
    render(<WatchlistView />, { wrapper: harness.Wrapper });
    expect(screen.getByRole('status', { name: 'Loading watchlist…' })).toHaveAttribute(
      'aria-busy',
      'true',
    );
  });

  it('WLV-02 invites the user to star a stock when the watchlist is empty', async () => {
    const harness = renderView();
    harness.api.listWatchlist.mockResolvedValue([]);
    render(<WatchlistView />, { wrapper: harness.Wrapper });

    expect(await screen.findByText('Your watchlist is empty')).toBeInTheDocument();
    expect(screen.getByText('Star a stock to follow it here.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Browse stocks' })).toHaveAttribute('href', '/stocks');
  });

  it('WLV-03 shows only the watched stocks, each with a pressed star', async () => {
    const harness = renderView();
    harness.api.listWatchlist.mockResolvedValue([watchlistItem]);
    render(<WatchlistView />, { wrapper: harness.Wrapper });

    expect(await screen.findByText('Apple Inc.')).toBeInTheDocument();
    expect(screen.queryByText('Berkshire Hathaway Inc.')).not.toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Watch AAPL' })).toHaveAttribute(
        'aria-pressed',
        'true',
      );
    });
  });

  it('WLV-04 takes a row away at once when its star is pressed', async () => {
    const harness = renderView();
    harness.api.listWatchlist.mockResolvedValue([watchlistItem]);
    harness.api.removeFromWatchlist.mockReturnValue(new Promise(() => undefined));
    render(<WatchlistView />, { wrapper: harness.Wrapper });
    await screen.findByText('Apple Inc.');
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Watch AAPL' })).toBeEnabled();
    });

    await userEvent.click(screen.getByRole('button', { name: 'Watch AAPL' }));

    expect(await screen.findByText('Your watchlist is empty')).toBeInTheDocument();
    expect(screen.queryByText('Apple Inc.')).not.toBeInTheDocument();
  });

  it('WLV-05 shows an error with a retry that loads the stocks', async () => {
    const harness = renderView();
    harness.api.listWatchlist
      .mockRejectedValueOnce(new ApiClientError({ kind: 'http', status: 400, message: 'bad' }))
      .mockResolvedValue([watchlistItem]);
    render(<WatchlistView />, { wrapper: harness.Wrapper });

    expect(await screen.findByRole('alert')).toHaveTextContent('Could not load your watchlist');
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByText('Apple Inc.')).toBeInTheDocument();
  });

  it('WLV-06 keeps the list when a refresh fails after it loaded', async () => {
    const harness = renderView();
    harness.api.listWatchlist.mockResolvedValue([watchlistItem]);
    render(<WatchlistView />, { wrapper: harness.Wrapper });
    await screen.findByText('Apple Inc.');

    harness.api.listWatchlist.mockRejectedValueOnce(
      new ApiClientError({ kind: 'http', status: 400, message: 'bad' }),
    );
    await act(async () => {
      await harness.queryClient.refetchQueries({ queryKey: ['watchlist'] });
    });

    expect(screen.getByText('Apple Inc.')).toBeInTheDocument();
    expect(
      within(document.body).queryByText('Could not load your watchlist'),
    ).not.toBeInTheDocument();
  });
});
