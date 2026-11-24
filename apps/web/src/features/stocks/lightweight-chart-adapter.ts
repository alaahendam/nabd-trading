import {
  CandlestickSeries,
  ColorType,
  createChart,
  HistogramSeries,
  type UTCTimestamp,
} from 'lightweight-charts';

import type { Candle, ChartColors, ChartPort, VolumeBar } from './chart-port';

const toChartTime = (seconds: number) => seconds as UTCTimestamp;

const chartOptions = (colors: ChartColors) => ({
  layout: {
    attributionLogo: true,
    textColor: colors.text,
    background: { type: ColorType.Solid, color: colors.background },
  },
  grid: { vertLines: { color: colors.grid }, horzLines: { color: colors.grid } },
});

const candleOptions = (colors: ChartColors) => ({
  upColor: colors.up,
  downColor: colors.down,
  wickUpColor: colors.up,
  wickDownColor: colors.down,
  borderVisible: false,
});

/**
 * The only file that imports the chart library. It maps the app's small `ChartPort` onto
 * lightweight-charts (Apache-2.0; the TradingView attribution logo is on, see the footer notice).
 */
export function createLightweightChart(
  container: HTMLElement,
  initial: ChartColors,
  locale: string,
): ChartPort {
  let colors = initial;
  let bars: readonly VolumeBar[] = [];

  const chart = createChart(container, {
    ...chartOptions(colors),
    autoSize: true,
    localization: { locale },
    rightPriceScale: { borderVisible: false },
    timeScale: { borderVisible: false, timeVisible: true },
  });
  const candles = chart.addSeries(CandlestickSeries, candleOptions(colors));
  const volume = chart.addSeries(HistogramSeries, {
    priceFormat: { type: 'volume' },
    priceScaleId: '',
  });
  volume.priceScale().applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } });

  const paintVolume = () => {
    volume.setData(
      bars.map((bar) => ({
        time: toChartTime(bar.time),
        value: bar.value,
        color: bar.direction === 'up' ? colors.up : colors.down,
      })),
    );
  };

  return {
    setData(data: readonly Candle[], volumeBars: readonly VolumeBar[]) {
      bars = volumeBars;
      candles.setData(data.map((candle) => ({ ...candle, time: toChartTime(candle.time) })));
      paintVolume();
      chart.timeScale().fitContent();
    },
    updateCandle(candle: Candle) {
      candles.update({ ...candle, time: toChartTime(candle.time) });
    },
    applyColors(next: ChartColors) {
      colors = next;
      chart.applyOptions(chartOptions(next));
      candles.applyOptions(candleOptions(next));
      paintVolume();
    },
    applyLocale(next: string) {
      chart.applyOptions({ localization: { locale: next } });
    },
    dispose() {
      chart.remove();
    },
  };
}
