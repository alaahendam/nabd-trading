import { ApiClientError } from '@nabd/api-client';
import type { WatchlistItem } from '@nabd/shared';
import { watchlistItem } from '@nabd/testing';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { createFeatureHarness } from '../../test/feature-harness';
import { WatchlistToggle } from './watchlist-toggle';

function renderToggle(list: WatchlistItem[] | 'pending', language?: 'en' | 'ar') {
  const harness = createFeatureHarness(language === undefined ? {} : { language });
  harness.api.listWatchlist.returns(
    list === 'pending' ? new Promise(() => undefined) : Promise.resolve(list),
  );
  harness.api.addToWatchlist.resolves(watchlistItem);
  harness.api.removeFromWatchlist.resolves(undefined);
  const view = render(<WatchlistToggle symbol="AAPL" />, { wrapper: harness.Wrapper });
  return { ...harness, ...view };
}

const star = () => screen.getByRole('button', { name: 'Watch AAPL' });

describe('WatchlistToggle', () => {
  it('WTG-01 reflects whether the symbol is in the watchlist', async () => {
    const { unmount } = renderToggle([]);
    await waitFor(() => {
      expect(star()).toBeEnabled();
    });
    expect(star()).toHaveAttribute('aria-pressed', 'false');
    unmount();

    renderToggle([watchlistItem]);
    await waitFor(() => {
      expect(star()).toHaveAttribute('aria-pressed', 'true');
    });
  });

  it('WTG-02 adds at once and tells the server', async () => {
    const { api } = renderToggle([]);
    api.addToWatchlist.returns(new Promise(() => undefined));
    await waitFor(() => {
      expect(star()).toBeEnabled();
    });

    await userEvent.click(star());

    await waitFor(() => {
      expect(star()).toHaveAttribute('aria-pressed', 'true');
    });
    expect(api.addToWatchlist.calls).toContainEqual(['AAPL']);
  });

  it('WTG-03 removes at once and tells the server', async () => {
    const { api } = renderToggle([watchlistItem]);
    api.removeFromWatchlist.returns(new Promise(() => undefined));
    await waitFor(() => {
      expect(star()).toHaveAttribute('aria-pressed', 'true');
    });

    await userEvent.click(star());

    await waitFor(() => {
      expect(star()).toHaveAttribute('aria-pressed', 'false');
    });
    expect(api.removeFromWatchlist.calls).toContainEqual(['AAPL']);
  });

  it('WTG-04 goes back and says so when the server refuses', async () => {
    const { api } = renderToggle([]);
    api.addToWatchlist.rejects(new ApiClientError({ kind: 'http', status: 400, message: 'no' }));
    await waitFor(() => {
      expect(star()).toBeEnabled();
    });

    await userEvent.click(star());

    expect(await screen.findByRole('alert')).toHaveTextContent('Could not update your watchlist');
    await waitFor(() => {
      expect(star()).toHaveAttribute('aria-pressed', 'false');
    });
  });

  it('WTG-05 is disabled while the list loads', () => {
    renderToggle('pending');
    expect(star()).toBeDisabled();
  });

  it('WTG-06 clears the message on a new attempt', async () => {
    const { api } = renderToggle([]);
    api.addToWatchlist.rejectsOnce(
      new ApiClientError({ kind: 'http', status: 400, message: 'no' }),
    );
    await waitFor(() => {
      expect(star()).toBeEnabled();
    });
    await userEvent.click(star());
    await screen.findByRole('alert');

    await userEvent.click(star());

    await waitFor(() => {
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  it('WTG-07 is named in Arabic with the Latin symbol', async () => {
    renderToggle([], 'ar');
    expect(await screen.findByRole('button', { name: 'متابعة AAPL' })).toBeInTheDocument();
  });

  it('WTG-08 hides the star character from assistive technology', async () => {
    renderToggle([watchlistItem]);
    await waitFor(() => {
      expect(star()).toHaveAttribute('aria-pressed', 'true');
    });
    const glyph = star().querySelector('[aria-hidden="true"]');
    expect(glyph).toHaveTextContent('★');
  });
});
