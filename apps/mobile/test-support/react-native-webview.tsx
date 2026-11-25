// Stands in for `react-native-webview` in every test: a WebView needs the device's browser engine.
// It renders a plain view with the props it was given, and writes down every script the app asks
// it to run, so a test can read what the chart was told, in order. Jest maps the package here (see
// `moduleNameMapper`).
import { forwardRef, useImperativeHandle } from 'react';
import { View, type ViewProps } from 'react-native';

/** Every script run, across all instances, in order. */
export const injected: string[] = [];

export function resetWebViews() {
  injected.length = 0;
}

export const WebView = forwardRef<{ injectJavaScript: (script: string) => void }, ViewProps>(
  function WebView(props, ref) {
    useImperativeHandle(ref, () => ({
      injectJavaScript: (script: string) => {
        injected.push(script);
      },
    }));
    return <View testID="chart-webview" {...props} />;
  },
);
