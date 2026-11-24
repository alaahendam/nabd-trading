import type { ChartLoader } from './chart-port';

/**
 * Loads the chart library only when a chart is first shown, so the stock list and the rest of the
 * app do not pay for it. The adapter is the only module that imports the library.
 */
export const loadLightweightChart: ChartLoader = async (container, colors, locale) => {
  const { createLightweightChart } = await import('./lightweight-chart-adapter');
  return createLightweightChart(container, colors, locale);
};
