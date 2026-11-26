import { LANGUAGE_STORAGE_KEY } from '@nabd/i18n';
import { aapl, aaplHistory } from '@nabd/testing';
import { resolveToken } from '@nabd/tokens';
import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';

import { fakeChartSurface, resetSurface, surface } from '../../../test-support/fake-chart-surface';
import { THEME_STORAGE_KEY } from '../../lib/storage/keys';
import { createTestApp } from '../../test-app';
import { ChartSurfaceProvider } from './chart-surface-context';
import { StockChart } from './stock-chart';
import { StockDetail } from './stock-detail';

const week = {
  ...aaplHistory,
  period: '1W' as const,
  points: [{ time: 1_699_000_000_000, open: 200, high: 240, low: 190, close: 210, volume: 1 }],
};

const DAY_SUMMARY = 'Past day: from $228.00 to $231.00, up 1.32%. High $232.00, low $227.00.';
const WEEK_SUMMARY = 'Past week: from $200.00 to $210.00, up 5.00%. High $240.00, low $190.00.';

const byPeriod = (app: ReturnType<typeof createTestApp>) => {
  app.api.getHistory.implement((_symbol, range) =>
    Promise.resolve(range === '1W' ? week : aaplHistory),
  );
};

const chart = (
  <ChartSurfaceProvider surface={fakeChartSurface}>
    <StockChart symbol="AAPL" />
  </ChartSurfaceProvider>
);

beforeEach(resetSurface);

describe('StockChart', () => {
  it('CHT-01 shows the five periods as buttons, one selected, each at least 48 high', async () => {
    const app = createTestApp();
    app.api.getHistory.resolves(aaplHistory);
    await app.render(chart);
    await screen.findByText(DAY_SUMMARY);

    const names = [
      '1D, Past day',
      '1W, Past week',
      '1M, Past month',
      '3M, Past 3 months',
      '1Y, Past year',
    ];
    for (const name of names) {
      const button = screen.getByRole('button', { name });
      expect(button).toHaveStyle({ minHeight: 48 });
      if (name === '1D, Past day') {
        expect(button).toBeSelected();
      } else {
        expect(button).not.toBeSelected();
      }
    }
  });

  it('CHT-02 loads the period that is chosen, and its summary follows', async () => {
    const app = createTestApp();
    byPeriod(app);
    await app.render(chart);
    expect(await screen.findByText(DAY_SUMMARY)).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole('button', { name: '1W, Past week' }));

    expect(await screen.findByText(WEEK_SUMMARY)).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: '1W, Past week' })).toBeSelected();
    expect(screen.getByRole('button', { name: '1D, Past day' })).not.toBeSelected();
    expect(app.api.getHistory.calls.map(([symbol, range]) => [symbol, range])).toEqual([
      ['AAPL', '1D'],
      ['AAPL', '1W'],
    ]);
  });

  it('CHT-03 shows a busy status while history loads', async () => {
    const app = createTestApp();
    app.api.getHistory.implement(() => new Promise(() => undefined));

    await app.render(chart);

    expect(screen.getByRole('progressbar', { name: 'Loading chart…' })).toBeOnTheScreen();
  });

  it('CHT-03 says so when a period has no data', async () => {
    const app = createTestApp();
    app.api.getHistory.resolves({ ...aaplHistory, points: [] });

    await app.render(chart);

    expect(await screen.findByText('No chart data for this period')).toBeOnTheScreen();
  });

  it('CHT-04 shows an error with a retry button, and retrying loads the chart', async () => {
    const app = createTestApp();
    app.api.getHistory.rejectsOnce(new Error('offline')).resolves(aaplHistory);
    await app.render(chart);

    expect(await screen.findByText('Could not load the chart')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Try again' }));

    expect(await screen.findByText(DAY_SUMMARY)).toBeOnTheScreen();
    expect(screen.queryByText('Could not load the chart')).not.toBeOnTheScreen();
  });

  it('CHT-04 keeps the stock figures when only the chart fails', async () => {
    const app = createTestApp();
    app.api.getStock.resolves(aapl);
    app.api.getHistory.rejects(new Error('offline'));

    await app.render(
      <ChartSurfaceProvider surface={fakeChartSurface}>
        <StockDetail symbol="AAPL" onBack={() => undefined}>
          {(symbol) => <StockChart symbol={symbol} />}
        </StockDetail>
      </ChartSurfaceProvider>,
    );

    expect(await screen.findByText('Could not load the chart')).toBeOnTheScreen();
    expect(screen.getByText('Apple Inc.')).toBeOnTheScreen();
    expect(screen.getByText('$230.00')).toBeOnTheScreen();
  });

  it('CHT-05 says the period, the start and end, the change, the high and the low', async () => {
    const app = createTestApp();
    app.api.getHistory.resolves(aaplHistory);

    await app.render(chart);

    expect(await screen.findByText(DAY_SUMMARY)).toBeOnTheScreen();
  });

  it('CHT-05 says "down" and "unchanged" in words too', async () => {
    const app = createTestApp();
    const point = { time: 1_699_000_000_000, high: 12, low: 8, volume: 1 };
    app.api.getHistory.resolves({ ...aaplHistory, points: [{ ...point, open: 10, close: 9 }] });
    await app.render(chart);
    expect(
      await screen.findByText(
        'Past day: from $10.00 to $9.00, down 10.00%. High $12.00, low $8.00.',
      ),
    ).toBeOnTheScreen();

    const flat = createTestApp();
    flat.api.getHistory.resolves({ ...aaplHistory, points: [{ ...point, open: 10, close: 10 }] });
    await flat.render(chart);
    expect(
      await screen.findByText(
        'Past day: from $10.00 to $10.00, unchanged. High $12.00, low $8.00.',
      ),
    ).toBeOnTheScreen();
  });

  it('CHT-06 labels the chart with the symbol and the period', async () => {
    const app = createTestApp();
    byPeriod(app);
    await app.render(chart);

    expect(screen.getByRole('image', { name: 'AAPL price chart: Past day' })).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: '1W, Past week' }));

    expect(screen.getByRole('image', { name: 'AAPL price chart: Past week' })).toBeOnTheScreen();
  });

  it('CHT-07 takes a period seen before from the cache', async () => {
    const app = createTestApp();
    byPeriod(app);
    await app.render(chart);
    await screen.findByText(DAY_SUMMARY);
    await fireEvent.press(screen.getByRole('button', { name: '1W, Past week' }));
    await screen.findByText(WEEK_SUMMARY);

    await fireEvent.press(screen.getByRole('button', { name: '1D, Past day' }));

    expect(await screen.findByText(DAY_SUMMARY)).toBeOnTheScreen();
    expect(app.api.getHistory.calls).toHaveLength(2);
  });

  it('CHT-08 puts live ticks on the last candle, keeping the high they reached', async () => {
    const app = createTestApp();
    app.api.getHistory.resolves(aaplHistory);
    await app.render(chart);
    await screen.findByText(DAY_SUMMARY);
    expect(surface.props?.live).toBeUndefined();
    await app.connect();

    await app.tick('AAPL', 235);
    expect(surface.props?.live).toEqual({
      time: 1_700_000_000,
      open: 230,
      high: 235,
      low: 229,
      close: 235,
    });

    await app.tick('AAPL', 231);
    expect(surface.props?.live).toEqual({
      time: 1_700_000_000,
      open: 230,
      high: 235,
      low: 229,
      close: 231,
    });
  });

  it('CHT-08 hands the chart the loaded candles and volume', async () => {
    const app = createTestApp();
    app.api.getHistory.resolves(aaplHistory);
    await app.render(chart);
    await screen.findByText(DAY_SUMMARY);

    expect(surface.props?.candles).toEqual([
      { time: 1_699_999_000, open: 228, high: 231, low: 227, close: 230 },
      { time: 1_700_000_000, open: 230, high: 232, low: 229, close: 231 },
    ]);
    expect(surface.props?.volume).toEqual([
      { time: 1_699_999_000, value: 5000, direction: 'up' },
      { time: 1_700_000_000, value: 6000, direction: 'up' },
    ]);
  });

  it('CHT-09 gives the chart the light theme colors and the English locale', async () => {
    const app = createTestApp();
    app.api.getHistory.resolves(aaplHistory);

    await app.render(chart);
    await screen.findByText(DAY_SUMMARY);

    expect(surface.props?.colors).toEqual({
      background: resolveToken('light', 'surface'),
      text: resolveToken('light', 'content-muted'),
      grid: resolveToken('light', 'line'),
      up: resolveToken('light', 'positive'),
      down: resolveToken('light', 'negative'),
    });
    expect(surface.props?.locale).toBe('en-US');
  });

  it('CHT-09 gives the chart the dark theme colors, and Arabic with Latin digits', async () => {
    const app = createTestApp({ [THEME_STORAGE_KEY]: 'dark', [LANGUAGE_STORAGE_KEY]: 'ar' });
    app.api.getHistory.resolves(aaplHistory);

    await app.render(chart);
    await waitFor(() => {
      expect(surface.props?.candles).toHaveLength(2);
    });

    expect(surface.props?.colors.background).toBe(resolveToken('dark', 'surface'));
    expect(surface.props?.colors.background).not.toBe(resolveToken('light', 'surface'));
    expect(surface.props?.locale).toBe('ar-u-nu-latn');
  });

  it('CHT-10 shows the TradingView notice under the chart', async () => {
    const app = createTestApp();
    app.api.getHistory.resolves(aaplHistory);

    await app.render(chart);
    await screen.findByText(DAY_SUMMARY);

    expect(
      screen.getByText('TradingView Lightweight Charts™ · Copyright © 2025 TradingView, Inc.'),
    ).toBeOnTheScreen();
  });

  it('CHT-11 reads the chart as one labelled image, and its numbers as text', async () => {
    const app = createTestApp();
    app.api.getHistory.resolves(aaplHistory);
    await app.render(chart);

    const figure = screen.getByRole('image', { name: 'AAPL price chart: Past day' });

    expect(figure.props['accessible']).toBe(true);
    expect(await screen.findByText(DAY_SUMMARY)).toBeOnTheScreen();
  });

  it('CHT-14 shows an error when the page fails to load, and retry loads it again', async () => {
    const app = createTestApp();
    app.api.getHistory.resolves(aaplHistory);
    await app.render(chart);
    await screen.findByText(DAY_SUMMARY);
    expect(surface.props?.attempt).toBe(0);

    await act(() => {
      surface.props?.onLoadError();
    });
    expect(screen.getByText('Could not load the chart')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Try again' }));

    expect(surface.props?.attempt).toBe(1);
    expect(screen.queryByText('Could not load the chart')).not.toBeOnTheScreen();
  });
});
