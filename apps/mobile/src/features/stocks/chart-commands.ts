import type { Candle, VolumeBar } from '@nabd/domain';

/** Resolved color values, not token names: the page cannot read the app's theme. */
export interface ChartColors {
  background: string;
  text: string;
  grid: string;
  up: string;
  down: string;
}

/**
 * What the app tells the chart page to do. Each command is one line of JavaScript that calls the
 * page's `window.nabd`, with its arguments as JSON. The values are numbers and strings the app
 * made, never text from the network. The trailing `true;` is what the WebView needs from a script.
 */
const call = (name: string, ...args: unknown[]) =>
  `window.nabd.${name}(${args.map((arg) => JSON.stringify(arg)).join(', ')});true;`;

export const setDataCommand = (candles: readonly Candle[], volume: readonly VolumeBar[]) =>
  call('setData', candles, volume);

export const updateCandleCommand = (candle: Candle) => call('updateCandle', candle);

export const colorsCommand = (colors: ChartColors) => call('applyColors', colors);

export const localeCommand = (locale: string) => call('applyLocale', locale);
