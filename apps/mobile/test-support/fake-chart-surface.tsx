// A chart surface for tests: it draws nothing and keeps the props it was last given, so a test can
// read what the chart would show. `onLoadError` can be called to play a page that failed to load.
import { View } from 'react-native';

import type { ChartSurfaceProps } from '../src/features/stocks/chart-surface';

export const surface: { props: ChartSurfaceProps | undefined } = { props: undefined };

export function resetSurface() {
  surface.props = undefined;
}

export function fakeChartSurface(props: ChartSurfaceProps) {
  surface.props = props;
  return <View testID="fake-chart" />;
}
