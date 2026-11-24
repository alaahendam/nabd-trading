import { createContext, type ReactNode, use } from 'react';

import type { ChartLoader } from './chart-port';

const ChartContext = createContext<ChartLoader | undefined>(undefined);

/** Gives the charts below it a way to create a chart, so tests can swap the real library out. */
export function ChartProvider({ loader, children }: { loader: ChartLoader; children: ReactNode }) {
  return <ChartContext value={loader}>{children}</ChartContext>;
}

export function useChartLoader(): ChartLoader {
  const loader = use(ChartContext);
  if (loader === undefined) {
    throw new Error('useChartLoader must be used inside <ChartProvider>.');
  }
  return loader;
}
