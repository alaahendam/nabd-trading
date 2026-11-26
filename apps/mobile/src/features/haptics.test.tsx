import { aaplHistory, watchlistItem } from '@nabd/testing';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { impactAsync } from 'expo-haptics';

import { fakeChartSurface } from '../../test-support/fake-chart-surface';
import { createTestApp } from '../test-app';
import { ChartSurfaceProvider } from './stocks/chart-surface-context';
import { StockChart } from './stocks/stock-chart';
import { WatchlistToggle } from './watchlist';

const tap = jest.mocked(impactAsync);

beforeEach(() => {
  tap.mockClear();
});

describe('haptics', () => {
  it('HAP-01 gives a light tap when the star is pressed', async () => {
    const app = createTestApp();
    app.api.listWatchlist.resolves([]);
    app.api.addToWatchlist.resolves(watchlistItem);
    await app.render(<WatchlistToggle symbol="AAPL" />);
    await screen.findByRole('button', { name: 'Watch AAPL', disabled: false });

    await fireEvent.press(screen.getByRole('button', { name: 'Watch AAPL' }));

    expect(tap).toHaveBeenCalledTimes(1);
    expect(tap).toHaveBeenCalledWith('light');
  });

  it('HAP-02 gives a light tap when another period is chosen, and none for the same one', async () => {
    const app = createTestApp();
    app.api.getHistory.resolves(aaplHistory);
    await app.render(
      <ChartSurfaceProvider surface={fakeChartSurface}>
        <StockChart symbol="AAPL" />
      </ChartSurfaceProvider>,
    );
    await screen.findByText(/^Past day: from/);

    await fireEvent.press(screen.getByRole('button', { name: '1D, Past day' }));
    expect(tap).not.toHaveBeenCalled();

    await fireEvent.press(screen.getByRole('button', { name: '1W, Past week' }));
    expect(tap).toHaveBeenCalledTimes(1);
    await screen.findByText(/^Past week: from/);
  });

  it('HAP-03 lets the press work when the device refuses the tap', async () => {
    tap.mockRejectedValueOnce(new Error('no vibration motor'));
    const app = createTestApp();
    app.api.listWatchlist.resolves([]);
    app.api.addToWatchlist.resolves(watchlistItem);
    await app.render(<WatchlistToggle symbol="AAPL" />);
    await screen.findByRole('button', { name: 'Watch AAPL', disabled: false });

    await fireEvent.press(screen.getByRole('button', { name: 'Watch AAPL' }));

    await waitFor(() => {
      expect(app.api.addToWatchlist.calls.map(([symbol]) => symbol)).toEqual(['AAPL']);
    });
    expect(screen.queryByRole('alert')).not.toBeOnTheScreen();
  });
});
