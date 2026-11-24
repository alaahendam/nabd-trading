import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ChartColors } from './chart-port';

const fakes = vi.hoisted(() => {
  const candleSeries = { setData: vi.fn(), update: vi.fn(), applyOptions: vi.fn() };
  const volumeScale = { applyOptions: vi.fn() };
  const volumeSeries = {
    setData: vi.fn(),
    applyOptions: vi.fn(),
    priceScale: vi.fn(() => volumeScale),
  };
  const timeScale = { fitContent: vi.fn() };
  const chart = {
    addSeries: vi.fn((kind: string) => (kind === 'candlestick' ? candleSeries : volumeSeries)),
    applyOptions: vi.fn(),
    timeScale: vi.fn(() => timeScale),
    remove: vi.fn(),
  };
  return { candleSeries, volumeSeries, volumeScale, timeScale, chart };
});

vi.mock('lightweight-charts', () => ({
  createChart: vi.fn(() => fakes.chart),
  CandlestickSeries: 'candlestick',
  HistogramSeries: 'histogram',
  ColorType: { Solid: 'solid' },
}));

const { createChart } = await import('lightweight-charts');
const { createLightweightChart } = await import('./lightweight-chart-adapter');

const light: ChartColors = {
  background: 'light-background',
  text: 'light-text',
  grid: 'light-grid',
  up: 'light-up',
  down: 'light-down',
};
const dark: ChartColors = {
  background: 'dark-background',
  text: 'dark-text',
  grid: 'dark-grid',
  up: 'dark-up',
  down: 'dark-down',
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('createLightweightChart', () => {
  it('ADP-01 creates a self-sizing chart with the attribution logo and two series', () => {
    const container = document.createElement('div');
    createLightweightChart(container, light, 'en-US');

    expect(createChart).toHaveBeenCalledWith(
      container,
      expect.objectContaining({
        autoSize: true,
        localization: { locale: 'en-US' },
        layout: expect.objectContaining({
          attributionLogo: true,
          textColor: 'light-text',
          background: { type: 'solid', color: 'light-background' },
        }) as unknown,
      }),
    );
    expect(fakes.chart.addSeries).toHaveBeenCalledWith(
      'candlestick',
      expect.objectContaining({ upColor: 'light-up', downColor: 'light-down' }),
    );
    expect(fakes.chart.addSeries).toHaveBeenCalledWith(
      'histogram',
      expect.objectContaining({ priceScaleId: '' }),
    );
    expect(fakes.volumeScale.applyOptions).toHaveBeenCalledTimes(1);
  });

  it('ADP-02 sets the data, colors the volume by direction and fits the view', () => {
    const port = createLightweightChart(document.createElement('div'), light, 'en-US');
    port.setData(
      [{ time: 100, open: 1, high: 3, low: 0.5, close: 2 }],
      [
        { time: 100, value: 10, direction: 'up' },
        { time: 200, value: 20, direction: 'down' },
      ],
    );

    expect(fakes.candleSeries.setData).toHaveBeenCalledWith([
      { time: 100, open: 1, high: 3, low: 0.5, close: 2 },
    ]);
    expect(fakes.volumeSeries.setData).toHaveBeenCalledWith([
      { time: 100, value: 10, color: 'light-up' },
      { time: 200, value: 20, color: 'light-down' },
    ]);
    expect(fakes.timeScale.fitContent).toHaveBeenCalledTimes(1);
  });

  it('ADP-03 updates the last candle', () => {
    const port = createLightweightChart(document.createElement('div'), light, 'en-US');
    port.updateCandle({ time: 100, open: 1, high: 3, low: 0.5, close: 2.5 });
    expect(fakes.candleSeries.update).toHaveBeenCalledWith({
      time: 100,
      open: 1,
      high: 3,
      low: 0.5,
      close: 2.5,
    });
  });

  it('ADP-04 applies new colors to the chart, the candles and the volume bars', () => {
    const port = createLightweightChart(document.createElement('div'), light, 'en-US');
    port.setData([], [{ time: 100, value: 10, direction: 'up' }]);
    fakes.volumeSeries.setData.mockClear();

    port.applyColors(dark);

    expect(fakes.chart.applyOptions).toHaveBeenCalledWith(
      expect.objectContaining({
        layout: expect.objectContaining({ textColor: 'dark-text' }) as unknown,
      }),
    );
    expect(fakes.candleSeries.applyOptions).toHaveBeenCalledWith(
      expect.objectContaining({ upColor: 'dark-up', downColor: 'dark-down' }),
    );
    expect(fakes.volumeSeries.setData).toHaveBeenCalledWith([
      { time: 100, value: 10, color: 'dark-up' },
    ]);
  });

  it('ADP-07 applies a locale to the chart', () => {
    const port = createLightweightChart(document.createElement('div'), light, 'en-US');
    port.applyLocale('ar-u-nu-latn');
    expect(fakes.chart.applyOptions).toHaveBeenCalledWith({
      localization: { locale: 'ar-u-nu-latn' },
    });
  });

  it('ADP-05 removes the chart on dispose', () => {
    const port = createLightweightChart(document.createElement('div'), light, 'en-US');
    port.dispose();
    expect(fakes.chart.remove).toHaveBeenCalledTimes(1);
  });
});
