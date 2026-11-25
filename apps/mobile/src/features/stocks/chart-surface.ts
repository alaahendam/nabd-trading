import type { Candle, VolumeBar } from '@nabd/domain';
import type { ComponentType } from 'react';

import type { ChartColors } from './chart-commands';

export type { ChartColors };

/**
 * What the chart needs from the screen, as props. The real surface is a WebView running
 * Lightweight Charts (ADR 0013); tests use a fake, because a WebView needs the device's browser.
 * It is the mobile counterpart of the web app's `ChartPort`, shaped as a component because that is
 * how a native view is held.
 */
export interface ChartSurfaceProps {
  candles: readonly Candle[];
  volume: readonly VolumeBar[];
  /** The last candle with the live price on it, or none when the period does not follow it. */
  live: Candle | undefined;
  colors: ChartColors;
  /** For the time axis and the crosshair, such as `ar-u-nu-latn`. */
  locale: string;
  /** The page could not load. */
  onLoadError: () => void;
  /** A new number loads the page again. */
  attempt: number;
}

export type ChartSurface = ComponentType<ChartSurfaceProps>;
