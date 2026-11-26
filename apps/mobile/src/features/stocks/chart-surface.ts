import type { Candle, VolumeBar } from '@nabd/domain';
import type { ReactNode } from 'react';

import type { ChartColors } from './chart-commands';

export type { ChartColors };

/**
 * What the chart needs from the screen, as props. The real surface is a WebView running
 * Lightweight Charts (ADR 0013); tests use a fake, because a WebView needs the device's browser.
 * It is the mobile counterpart of the web app's `ChartPort`.
 */
export interface ChartSurfaceProps {
  candles: readonly Candle[];
  volume: readonly VolumeBar[];
  /** The last candle with the live price on it, or none before the first tick. */
  live: Candle | undefined;
  colors: ChartColors;
  /** For the time axis and the crosshair, such as `ar-u-nu-latn`. */
  locale: string;
  /** The page could not load. */
  onLoadError: () => void;
  /** A new number loads the page again. */
  attempt: number;
}

/** Draws a chart for these props. A function and not a component, so a screen can swap it. */
export type ChartSurface = (props: ChartSurfaceProps) => ReactNode;
