import { type HistoryData, PERIOD_CONFIG } from '@nabd/shared';
import { aaplHistory } from '@nabd/testing';
import { act, render, renderHook, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ApiClientError, type HistoryRange } from '../../lib/api';
import { createFeatureHarness } from '../../test/feature-harness';
import { useChartLoader } from './chart-context';
import { StockChart } from './stock-chart';

const LAST_POINT_MS = 1_700_000_000_000;
const FIVE_MINUTES = 300_000;

/** What the server answers: a period has its own candle size, a custom range 30 minutes here. */
const historyFor = (symbol: string, range: HistoryRange): HistoryData => ({
  ...aaplHistory,
  symbol,
  period: typeof range === 'string' ? range : 'custom',
  bucketMs: typeof range === 'string' ? PERIOD_CONFIG[range].bucketMs : 1_800_000,
});

function renderChart(language?: 'en' | 'ar') {
  const harness = createFeatureHarness(language === undefined ? {} : { language });
  harness.api.getHistory.implement((symbol, range) => Promise.resolve(historyFor(symbol, range)));
  const view = render(<StockChart symbol="AAPL" />, { wrapper: harness.Wrapper });
  return { ...harness, ...view };
}

/** Lets the chart load and the history arrive. */
const settle = async () => {
  await act(async () => {
    await Promise.resolve();
  });
  await screen.findByRole('figure');
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
    expect(chart.loader.mock.calls[0]?.[0]).toBe(screen.getByRole('figure'));
    expect(chart.port.dispose).not.toHaveBeenCalled();

    unmount();
    expect(chart.port.dispose).toHaveBeenCalledTimes(1);
  });

  it('CHT-02 loads the default period into the chart', async () => {
    const { api, chart } = renderChart();
    await settle();
    expect(api.getHistory.calls).toContainEqual(['AAPL', '1D', expect.any(AbortSignal)]);
    expect(chart.port.setData).toHaveBeenCalledTimes(1);
    const [candles, volume] = chart.port.setData.mock.calls[0] ?? [];
    expect(candles).toHaveLength(2);
    expect(candles?.[0]).toMatchObject({ time: 1_699_999_000, open: 228, close: 230 });
    expect(volume?.[0]).toMatchObject({ time: 1_699_999_000, value: 5000, direction: 'up' });
  });

  it('CHT-03 switches the period', async () => {
    const { api, chart } = renderChart();
    await settle();
    expect(screen.getByRole('button', { name: '1D, Past day' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    await userEvent.click(screen.getByRole('button', { name: '1W, Past week' }));
    await act(async () => {
      await Promise.resolve();
    });

    expect(api.getHistory.calls).toContainEqual(['AAPL', '1W', expect.any(AbortSignal)]);
    expect(screen.getByRole('button', { name: '1W, Past week' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: '1D, Past day' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    expect(chart.port.setData).toHaveBeenCalledTimes(2);
  });

  it('CHT-04 shows a busy status while the history loads', () => {
    const harness = createFeatureHarness();
    harness.api.getHistory.returns(new Promise(() => undefined));
    render(<StockChart symbol="AAPL" />, { wrapper: harness.Wrapper });
    expect(screen.getByRole('status', { name: 'Loading chart…' })).toHaveAttribute(
      'aria-busy',
      'true',
    );
  });

  it('CHT-05 shows an error with a retry that loads the data', async () => {
    const harness = createFeatureHarness();
    harness.api.getHistory
      .rejectsOnce(new ApiClientError({ kind: 'http', status: 400, message: 'bad' }))
      .resolves(historyFor('AAPL', '1D'));
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
    harness.api.getHistory.resolves({ ...historyFor('AAPL', '1D'), points: [] });
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
    harness.api.getHistory.returns(
      new Promise<HistoryData>((done) => {
        resolve = done;
      }),
    );
    render(<StockChart symbol="AAPL" />, { wrapper: harness.Wrapper });
    await screen.findByRole('figure');
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
      grid: 'light--grid',
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
      grid: 'dark--grid',
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
    harness.api.getHistory.resolves(historyFor('AAPL', '1D'));
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
    const image = screen.getByRole('figure');
    expect(image).toHaveAttribute('aria-label', 'AAPL price chart: Past day');
    expect(image).toHaveAttribute('dir', 'ltr');
  });

  it('CHT-12 names the period buttons in Arabic and keeps the codes Latin', async () => {
    renderChart('ar');
    await settle();
    const day = screen.getByRole('button', { name: '1D, اليوم الماضي' });
    expect(day).toHaveTextContent('1D');
    expect(screen.getByRole('group', { name: 'فترة الرسم البياني' })).toBeInTheDocument();
  });

  it('CHT-13 shows an error when the chart library fails to load, and retries', async () => {
    const harness = createFeatureHarness();
    harness.api.getHistory.resolves(historyFor('AAPL', '1D'));
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
    harness.api.getHistory.resolves(historyFor('AAPL', '1D'));
    const view = render(<StockChart symbol="AAPL" />, { wrapper: harness.Wrapper });
    view.unmount();

    await act(async () => {
      fail();
      await Promise.resolve();
    });
    expect(harness.chart.port.dispose).not.toHaveBeenCalled();
  });
});

describe('StockChart language', () => {
  it('CHT-17 starts in the language of the app', async () => {
    const english = renderChart();
    await settle();
    expect(english.chart.loader.mock.calls[0]?.[2]).toBe('en-US');
    english.unmount();

    const arabic = renderChart('ar');
    await settle();
    expect(arabic.chart.loader.mock.calls[0]?.[2]).toBe('ar-u-nu-latn');
  });

  it('CHT-18 follows a language change without creating a second chart', async () => {
    const { chart, i18n } = renderChart();
    await settle();
    chart.port.applyLocale.mockClear();

    await act(async () => {
      await i18n.changeLanguage('ar');
    });

    expect(chart.port.applyLocale).toHaveBeenLastCalledWith('ar-u-nu-latn');
    expect(chart.loader).toHaveBeenCalledTimes(1);
  });
});

describe('the chart text alternative', () => {
  const candle = (open: number, high: number, low: number, close: number) => ({
    time: LAST_POINT_MS,
    open,
    high,
    low,
    close,
    volume: 1,
  });

  const renderWith = (points: HistoryData['points'], language?: 'en' | 'ar') => {
    const harness = createFeatureHarness(language === undefined ? {} : { language });
    harness.api.getHistory.implement((symbol, range) =>
      Promise.resolve({ ...historyFor(symbol, range), points }),
    );
    render(<StockChart symbol="AAPL" />, { wrapper: harness.Wrapper });
    return harness;
  };

  it('CHT-22 describes the chart: period, start, end, change, high and low', async () => {
    renderChart();
    await settle();
    expect(screen.getByRole('figure')).toHaveAccessibleDescription(
      'Past day: from $228.00 to $231.00, up 1.32%. High $232.00, low $227.00.',
    );
  });

  it('CHT-23 follows the period', async () => {
    renderChart();
    await settle();

    await userEvent.click(screen.getByRole('button', { name: '1W, Past week' }));
    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getByRole('figure')).toHaveAccessibleDescription(/^Past week: from \$228\.00/);
  });

  it('CHT-24 says down, and unchanged, in words', async () => {
    renderWith([candle(200, 205, 150, 150)]);
    await screen.findByRole('figure');
    expect(await screen.findByText(/down 25\.00%/)).toBeInTheDocument();
    expect(screen.getByRole('figure')).toHaveAccessibleDescription(
      'Past day: from $200.00 to $150.00, down 25.00%. High $205.00, low $150.00.',
    );
  });

  it('CHT-25 says unchanged when the move rounds to nothing', async () => {
    renderWith([candle(200, 200.5, 199.5, 200.001)]);
    expect(await screen.findByText(/unchanged/)).toBeInTheDocument();
  });

  it('CHT-26 is in Arabic in the Arabic app, with Latin digits', async () => {
    renderWith(aaplHistory.points, 'ar');
    expect(await screen.findByText(/ارتفاع 1\.32%/)).toBeInTheDocument();
    expect(screen.getByRole('figure')).toHaveAccessibleDescription(
      'اليوم الماضي: من $228.00 إلى $231.00، ارتفاع 1.32%. الأعلى $232.00، الأدنى $227.00.',
    );
  });

  it('CHT-27 names a custom range by its dates', async () => {
    renderChart();
    await settle();
    await userEvent.click(screen.getByRole('button', { name: 'Custom' }));
    await userEvent.click(screen.getByRole('button', { name: 'Apply' }));
    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getByRole('figure')).toHaveAccessibleDescription(
      /^\d{4}-\d{2}-\d{2} – \d{4}-\d{2}-\d{2}: from \$228\.00/,
    );
  });

  it('CHT-28 has no description while there is nothing to describe', async () => {
    const harness = createFeatureHarness();
    harness.api.getHistory.returns(new Promise(() => undefined));
    render(<StockChart symbol="AAPL" />, { wrapper: harness.Wrapper });
    expect(screen.getByRole('figure')).not.toHaveAttribute('aria-describedby');

    const empty = renderWith([]);
    expect(empty.chart.loader).toBeDefined();
    expect(await screen.findByText('No chart data for this period')).toBeInTheDocument();
    expect(screen.getAllByRole('figure')[1]).not.toHaveAttribute('aria-describedby');
  });
});

describe('useChartLoader', () => {
  it('CHT-16 needs its provider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(() => renderHook(() => useChartLoader())).toThrow(/ChartProvider/);
    spy.mockRestore();
  });
});
