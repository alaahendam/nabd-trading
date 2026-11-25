import { createContext, type ReactNode, use } from 'react';

import type { ChartSurface } from './chart-surface';
import { WebViewChartSurface } from './webview-chart-surface';

const ChartSurfaceContext = createContext<ChartSurface>(WebViewChartSurface);

/** Swaps the chart surface, as tests do with a fake. The app uses the default: the WebView. */
export function ChartSurfaceProvider({
  surface,
  children,
}: {
  surface: ChartSurface;
  children: ReactNode;
}) {
  return <ChartSurfaceContext value={surface}>{children}</ChartSurfaceContext>;
}

export function useChartSurface(): ChartSurface {
  return use(ChartSurfaceContext);
}
