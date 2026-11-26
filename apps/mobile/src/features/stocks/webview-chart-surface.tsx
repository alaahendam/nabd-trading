import { useEffect, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

import {
  colorsCommand,
  localeCommand,
  setDataCommand,
  updateCandleCommand,
} from './chart-commands';
import { buildChartPage } from './chart-page';
import type { ChartSurfaceProps } from './chart-surface';
import { chartLibrarySource } from './generated/chart-library';

const page = buildChartPage(chartLibrarySource);

const styles = StyleSheet.create({ webView: { flex: 1 } });

/** Only the page itself loads: a link inside it, such as the logo, is not followed. */
const staysOnThePage = (request: { url: string }) => !request.url.startsWith('http');

/**
 * The chart, in a WebView. Nothing is sent before the page says it is ready; then the colors, the
 * locale and the data go in that order, and later changes send only what changed. The page is not
 * content for a screen reader: the screen describes the chart in text instead.
 */
function ChartPage({
  candles,
  volume,
  live,
  colors,
  locale,
  onLoadError,
}: Omit<ChartSurfaceProps, 'attempt'>) {
  // The class's default type argument is undefined, which makes its props never; object does not.
  const webView = useRef<WebView<object>>(null);
  const [ready, setReady] = useState(false);

  // These effects run in this order when the page becomes ready, and one at a time afterwards.
  useEffect(() => {
    if (ready) webView.current?.injectJavaScript(colorsCommand(colors));
  }, [ready, colors]);
  useEffect(() => {
    if (ready) webView.current?.injectJavaScript(localeCommand(locale));
  }, [ready, locale]);
  useEffect(() => {
    if (ready) webView.current?.injectJavaScript(setDataCommand(candles, volume));
  }, [ready, candles, volume]);
  useEffect(() => {
    if (ready && live !== undefined) webView.current?.injectJavaScript(updateCandleCommand(live));
  }, [ready, live]);

  return (
    <WebView
      ref={webView}
      source={{ html: page }}
      originWhitelist={['*']}
      style={styles.webView}
      scrollEnabled={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      onShouldStartLoadWithRequest={staysOnThePage}
      onMessage={(event) => {
        if (event.nativeEvent.data === 'ready') setReady(true);
      }}
      onError={onLoadError}
    />
  );
}

/** Loads the page again when `attempt` changes: a new key is a new WebView. */
export function WebViewChartSurface({ attempt, ...props }: ChartSurfaceProps) {
  return <ChartPage key={attempt} {...props} />;
}
