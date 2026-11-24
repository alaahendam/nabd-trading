import type { HistoryData } from '@nabd/shared';
import { act, render, renderHook, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ApiClientError } from '../../lib/api';
import { createFeatureHarness } from '../../test/feature-harness';
import { aaplHistory } from '../../test/fixtures';
import { useChartLoader } from './chart-context';
import { StockChart } from './stock-chart';

const LAST_POINT_MS = 1_700_000_000_000;
const FIVE_MINUTES = 300_000;

const historyFor = (symbol: string, period: HistoryData['period']): HistoryData => ({
  ...aaplHistory,
  symbol,
  period,
});

function renderChart(language?: 'en' | 'ar') {
  const harness = createFeatureHarness(language === undefined ? {} : { language });
  harness.api.getHistory.mockImplementation((symbol, period) =>
    Promise.resolve(historyFor(symbol, period)),
  );
  const view = render(<StockChart symbol="AAPL" />, { wrapper: harness.Wrapper });
  return { ...harness, ...view };
}

/** Lets the chart load and the history arrive. */
const settle = async () => {
  await act(async () => {
    await Promise.resolve();
  });
  await screen.findByRole('img');
  await act(async () => {
    await Promise.resolve();
  });
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe('StockChart', () => {
  it('CHT-01 creates one chart per mount and disposes it on unmount', async () => {
    const { chart, unmount } = renderChart();
    await settle();
    expect(chart.loader).toHaveBeenCalledTimes(1);
    expect(chart.loader.mock.calls[0]?.[0]).toBe(screen.getByRole('img'));
    expect(chart.port.dispose).not.toHaveBeenCalled();

    unmount();
    expect(chart.port.dispose).toHaveBeenCalledTimes(1);
  });

  it('CHT-02 loads the default period into the chart', async () => {
    const { api, chart } = renderChart();
    await settle();
    expect(api.getHistory).toHaveBeenCalledWith('AAPL', '1D', expect.any(AbortSignal));
    expect(chart.port.setData).toHaveBeenCalledTimes(1);
    const [candles, volume] = chart.port.setData.mock.calls[0] ?? [];
    expect(candles).toHaveLength(2);
    expect(candles?.[0]).toMatchObject({ time: 1_699_999_000, open: 228, close: 230 });
    expect(volume?.[0]).toMatchObject({ time: 1_699_999_000, value: 5000, direction: 'up' });
  });

  it('CHT-03 switches the period', async () => {
    const { api, chart } = renderChart();
    await settle();
    expect(screen.getByRole('button', { name: 'Past day' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    await userEvent.click(screen.getByRole('button', { name: 'Past week' }));
    await act(async () => {
      await Promise.resolve();
    });

    expect(api.getHistory).toHaveBeenCalledWith('AAPL', '1W', expect.any(AbortSignal));
    expect(screen.getByRole('button', { name: 'Past week' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: 'Past day' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    expect(chart.port.setData).toHaveBeenCalledTimes(2);
  });

  it('CHT-04 shows a busy status while the history loads', () => {
    const harness = createFeatureHarness();
    harness.api.getHistory.mockReturnValue(new Promise(() => undefined));
    render(<StockChart symbol="AAPL" />, { wrapper: harness.Wrapper });
    expect(screen.getByRole('status', { name: 'Loading chart…' })).toHaveAttribute(
      'aria-busy',
      'true',
    );
  });

  it('CHT-05 shows an error with a retry that loads the data', async () => {
    const harness = createFeatureHarness();
    harness.api.getHistory
      .mockRejectedValueOnce(new ApiClientError({ kind: 'http', status: 400, message: 'bad' }))
      .mockResolvedValue(historyFor('AAPL', '1D'));
    render(<StockChart symbol="AAPL" />, { wrapper: harness.Wrapper });

    expect(await screen.findByRole('alert')).toHaveTextContent('Could not load the chart');
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(harness.chart.port.setData).toHaveBeenCalledTimes(1);
  });

  it('CHT-06 says so when there is no data for the period', async () => {
    const harness = createFeatureHarness();
    harness.api.getHistory.mockResolvedValue({ ...historyFor('AAPL', '1D'), points: [] });
    render(<StockChart symbol="AAPL" />, { wrapper: harness.Wrapper });
    expect(await screen.findByText('No chart data for this period')).toBeInTheDocument();
  });

  it('CHT-07 moves the last candle with a live tick', async () => {
    const { chart, connect, tick } = renderChart();
    await settle();
    connect();
    tick([{ symbol: 'AAPL', price: 240, timestamp: LAST_POINT_MS + 60_000 }]);

    expect(chart.port.updateCandle).toHaveBeenCalledTimes(1);
    expect(chart.port.updateCandle.mock.calls[0]?.[0]).toEqual({
      time: 1_700_000_000,
      open: 230,
      high: 240,
      low: 229,
      close: 240,
    });
  });

  it('CHT-08 ignores ticks for other symbols and ticks before the history arrives', async () => {
    const harness = createFeatureHarness();
    let resolve: (history: HistoryData) => void = () => undefined;
    harness.api.getHistory.mockReturnValue(
      new Promise<HistoryData>((done) => {
        resolve = done;
      }),
    );
    render(<StockChart symbol="AAPL" />, { wrapper: harness.Wrapper });
    await screen.findByRole('img');
    await act(async () => {
      await Promise.resolve();
    });
    harness.connect();
    harness.tick([{ symbol: 'AAPL', price: 240 }]);
    expect(harness.chart.port.updateCandle).not.toHaveBeenCalled();

    await act(async () => {
      resolve(historyFor('AAPL', '1D'));
      await Promise.resolve();
    });
    harness.chart.port.updateCandle.mockClear();
    harness.tick([{ symbol: 'MSFT', price: 400 }]);
    expect(harness.chart.port.updateCandle).not.toHaveBeenCalled();
  });

  it('CHT-09 hands the chart the theme colors and refreshes them when the theme changes', async () => {
    const theme = { current: 'light' };
    vi.spyOn(window, 'getComputedStyle').mockReturnValue({
      getPropertyValue: (name: string) => `${theme.current}${name}`,
    } as CSSStyleDeclaration);
    const { chart, themeStore } = renderChart();
    await settle();
    expect(chart.loader.mock.calls[0]?.[1]).toEqual({
      background: 'light--surface-raised',
      text: 'light--content-muted',
      grid: 'light--line',
      up: 'light--positive',
      down: 'light--negative',
    });

    theme.current = 'dark';
    act(() => {
      themeStore.setPreference('dark');
    });
    expect(chart.port.applyColors).toHaveBeenLastCalledWith({
      background: 'dark--surface-raised',
      text: 'dark--content-muted',
      grid: 'dark--line',
      up: 'dark--positive',
      down: 'dark--negative',
    });
  });

  it('CHT-10 disposes the chart as soon as it arrives when the screen is already gone', async () => {
    const harness = createFeatureHarness();
    let arrive: () => void = () => undefined;
    harness.chart.loader.mockReturnValue(
      new Promise((done) => {
        arrive = () => {
          done(harness.chart.port);
        };
      }),
    );
    harness.api.getHistory.mockResolvedValue(historyFor('AAPL', '1D'));
    const view = render(<StockChart symbol="AAPL" />, { wrapper: harness.Wrapper });
    view.unmount();
    expect(harness.chart.port.dispose).not.toHaveBeenCalled();

    await act(async () => {
      arrive();
      await Promise.resolve();
    });
    expect(harness.chart.port.dispose).toHaveBeenCalledTimes(1);
    expect(harness.chart.port.setData).not.toHaveBeenCalled();
  });

  it('CHT-11 is an image with a label, drawn left to right', async () => {
    renderChart();
    await settle();
    const image = screen.getByRole('img');
    expect(image).toHaveAttribute('aria-label', 'AAPL price chart: Past day');
    expect(image).toHaveAttribute('dir', 'ltr');
  });

  it('CHT-12 names the period buttons in Arabic and keeps the codes Latin', async () => {
    renderChart('ar');
    await settle();
    const day = screen.getByRole('button', { name: 'اليوم الماضي' });
    expect(day).toHaveTextContent('1D');
    expect(screen.getByRole('group', { name: 'فترة الرسم البياني' })).toBeInTheDocument();
  });

  it('CHT-13 shows an error when the chart library fails to load, and retries', async () => {
    const harness = createFeatureHarness();
    harness.api.getHistory.mockResolvedValue(historyFor('AAPL', '1D'));
    harness.chart.loader.mockRejectedValueOnce(new Error('chunk failed'));
    render(<StockChart symbol="AAPL" />, { wrapper: harness.Wrapper });

    expect(await screen.findByRole('alert')).toHaveTextContent('Could not load the chart');
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(harness.chart.loader).toHaveBeenCalledTimes(2);
    expect(harness.chart.port.setData).toHaveBeenCalledTimes(1);
  });

  it('CHT-14 starts a new candle for a tick in the next bucket', async () => {
    const { chart, connect, tick } = renderChart();
    await settle();
    connect();
    const timestamp = LAST_POINT_MS + 10 * 60_000;
    tick([{ symbol: 'AAPL', price: 250, timestamp }]);

    expect(chart.port.updateCandle.mock.calls[0]?.[0]).toEqual({
      time: (Math.floor(timestamp / FIVE_MINUTES) * FIVE_MINUTES) / 1000,
      open: 250,
      high: 250,
      low: 250,
      close: 250,
    });
  });

  it('CHT-15 ignores a library failure that arrives after the screen is gone', async () => {
    const harness = createFeatureHarness();
    let fail: () => void = () => undefined;
    harness.chart.loader.mockReturnValue(
      new Promise((_resolve, reject) => {
        fail = () => {
          reject(new Error('late failure'));
        };
      }),
    );
    harness.api.getHistory.mockResolvedValue(historyFor('AAPL', '1D'));
    const view = render(<StockChart symbol="AAPL" />, { wrapper: harness.Wrapper });
    view.unmount();

    await act(async () => {
      fail();
      await Promise.resolve();
    });
    expect(harness.chart.port.dispose).not.toHaveBeenCalled();
  });
});

describe('useChartLoader', () => {
  it('CHT-16 needs its provider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(() => renderHook(() => useChartLoader())).toThrow(/ChartProvider/);
    spy.mockRestore();
  });
});
