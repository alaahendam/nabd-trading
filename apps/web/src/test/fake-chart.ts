import { vi } from 'vitest';

import type { ChartLoader, ChartPort } from '../features/stocks/chart-port';

/** A chart port whose methods are spies, and a loader that hands it out. */
export function createFakeChart() {
  const port = {
    setData: vi.fn<ChartPort['setData']>(),
    updateCandle: vi.fn<ChartPort['updateCandle']>(),
    applyColors: vi.fn<ChartPort['applyColors']>(),
    applyLocale: vi.fn<ChartPort['applyLocale']>(),
    dispose: vi.fn<ChartPort['dispose']>(),
  } satisfies ChartPort;
  const loader = vi.fn<ChartLoader>(() => Promise.resolve(port));
  return { port, loader };
}
