import { toCandles, toVolumeBars } from '@nabd/domain';
import { aaplHistory } from '@nabd/testing';
import { resolveToken } from '@nabd/tokens';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { injected, resetWebViews } from '../../../test-support/react-native-webview';
import {
  colorsCommand,
  localeCommand,
  setDataCommand,
  updateCandleCommand,
} from './chart-commands';
import type { ChartSurfaceProps } from './chart-surface';
import { WebViewChartSurface } from './webview-chart-surface';

const colors = {
  background: resolveToken('light', 'surface'),
  text: resolveToken('light', 'content-muted'),
  grid: resolveToken('light', 'line'),
  up: resolveToken('light', 'positive'),
  down: resolveToken('light', 'negative'),
};
const candles = toCandles(aaplHistory.points);
const volume = toVolumeBars(aaplHistory.points);
const live = { time: 1, open: 2, high: 3, low: 1, close: 2.5 };

const props: ChartSurfaceProps = {
  candles,
  volume,
  live: undefined,
  colors,
  locale: 'en-US',
  onLoadError: () => undefined,
  attempt: 0,
};

const pageIsReady = async () => {
  await fireEvent(screen.getByTestId('chart-webview', { hidden: true }), 'message', {
    nativeEvent: { data: 'ready' },
  });
};

beforeEach(resetWebViews);

describe('WebViewChartSurface', () => {
  it('CHT-12 sends nothing before the page is ready', async () => {
    await render(<WebViewChartSurface {...props} live={live} />);

    expect(injected).toEqual([]);
  });

  it('CHT-12 sends the colors, the locale and the data, in that order, once ready', async () => {
    await render(<WebViewChartSurface {...props} />);

    await pageIsReady();

    expect(injected).toEqual([
      colorsCommand(colors),
      localeCommand('en-US'),
      setDataCommand(candles, volume),
    ]);
  });

  it('CHT-12 sends the live candle after the data, when there is one', async () => {
    await render(<WebViewChartSurface {...props} live={live} />);

    await pageIsReady();

    expect(injected.at(-2)).toBe(setDataCommand(candles, volume));
    expect(injected.at(-1)).toBe(updateCandleCommand(live));
  });

  it('CHT-12 ignores a message that is not "ready"', async () => {
    await render(<WebViewChartSurface {...props} />);

    await fireEvent(screen.getByTestId('chart-webview', { hidden: true }), 'message', {
      nativeEvent: { data: 'something else' },
    });

    expect(injected).toEqual([]);
  });

  it('CHT-12 sends only what changed afterwards', async () => {
    const view = await render(<WebViewChartSurface {...props} />);
    await pageIsReady();
    injected.length = 0;

    await view.rerender(<WebViewChartSurface {...props} live={live} />);
    expect(injected).toEqual([updateCandleCommand(live)]);
    injected.length = 0;

    await view.rerender(<WebViewChartSurface {...props} live={live} locale="ar-u-nu-latn" />);
    expect(injected).toEqual([localeCommand('ar-u-nu-latn')]);
    injected.length = 0;

    const dark = { ...colors, background: resolveToken('dark', 'surface') };
    await view.rerender(
      <WebViewChartSurface {...props} live={live} locale="ar-u-nu-latn" colors={dark} />,
    );
    expect(injected).toEqual([colorsCommand(dark)]);
  });

  it('CHT-11 hides the WebView from screen readers', async () => {
    await render(<WebViewChartSurface {...props} />);

    const webView = screen.getByTestId('chart-webview', { hidden: true });

    expect(webView.props).toMatchObject({
      accessibilityElementsHidden: true,
      importantForAccessibility: 'no-hide-descendants',
    });
  });

  it('CHT-14 reports a page that fails to load', async () => {
    const failures = { count: 0 };
    await render(
      <WebViewChartSurface
        {...props}
        onLoadError={() => {
          failures.count += 1;
        }}
      />,
    );

    await fireEvent(screen.getByTestId('chart-webview', { hidden: true }), 'error', {
      nativeEvent: { description: 'net::ERR_FAILED' },
    });

    expect(failures.count).toBe(1);
  });

  it('CHT-14 loads a new page when the attempt changes, and waits for it to be ready', async () => {
    const view = await render(<WebViewChartSurface {...props} />);
    await pageIsReady();
    injected.length = 0;

    await view.rerender(<WebViewChartSurface {...props} attempt={1} />);
    expect(injected).toEqual([]);

    await pageIsReady();
    expect(injected).toHaveLength(3);
  });

  it('CHT-15 follows no link in the page, such as the logo', async () => {
    await render(<WebViewChartSurface {...props} />);
    const webView = screen.getByTestId('chart-webview', { hidden: true });
    const shouldLoad = webView.props['onShouldStartLoadWithRequest'] as (request: {
      url: string;
    }) => boolean;

    expect(shouldLoad({ url: 'https://www.tradingview.com/' })).toBe(false);
    expect(shouldLoad({ url: 'about:blank' })).toBe(true);
  });
});
