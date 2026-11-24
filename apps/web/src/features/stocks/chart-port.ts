/** One candle. `time` is in seconds, which is what the chart library expects. */
export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface VolumeBar {
  time: number;
  value: number;
  direction: 'up' | 'down';
}

/** Resolved color values (not token names), read from the CSS tokens. */
export interface ChartColors {
  background: string;
  text: string;
  grid: string;
  up: string;
  down: string;
}

/**
 * The part of a chart the app needs. The real implementation wraps `lightweight-charts`; tests
 * use a fake, because the library draws on a canvas that the test environment does not have.
 */
export interface ChartPort {
  setData(candles: readonly Candle[], volume: readonly VolumeBar[]): void;
  updateCandle(candle: Candle): void;
  applyColors(colors: ChartColors): void;
  /** The locale for the time axis and the crosshair, such as `ar-u-nu-latn`. */
  applyLocale(locale: string): void;
  dispose(): void;
}

/** Creates a chart in an element. Loading is asynchronous so the library is code-split. */
export type ChartLoader = (
  container: HTMLElement,
  colors: ChartColors,
  locale: string,
) => Promise<ChartPort>;
