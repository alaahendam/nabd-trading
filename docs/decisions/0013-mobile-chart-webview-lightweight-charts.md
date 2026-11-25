# 0013. The mobile chart is Lightweight Charts in a WebView

- Status: accepted
- Date: 2026-11-26

## Context

The stock detail needs a candlestick chart with a price scale, a time scale, and a live last candle. The web app uses TradingView Lightweight Charts behind a port (ADR 0007). Mobile has no DOM, so the question is how to draw the same chart natively.

## Candidates

1. **victory-native.** Ruled out on documented grounds, not measured: its latest release needs `@shopify/react-native-skia` 2.15.5 or newer while Expo SDK 58 pins 2.14.0, and its README lists no candlestick series.
2. **Skia, drawing candles ourselves** (`@shopify/react-native-skia` 2.14.0).
3. **WebView with Lightweight Charts** (`react-native-webview` 14.0.1, `lightweight-charts` 5.x, the library inlined into the page).

## The spike

Both candidates 2 and 3 drew the same 300 synthetic candles in a temporary screen (removed afterwards). On the author's Android phone, in Expo Go:

| Check                                                                | Skia                                             | WebView + Lightweight Charts          |
| -------------------------------------------------------------------- | ------------------------------------------------ | ------------------------------------- |
| Time to first draw                                                   | 169 ms                                           | 61 ms                                 |
| JS frames per second while the last candle updates 10 times a second | not captured (the run only recorded the WebView) | 104.8 fps                             |
| Price scale, time scale, last-price line                             | none; each would be our own code                 | included                              |
| Looks like the web chart                                             | no                                               | yes                                   |
| Bundle cost                                                          | native library                                   | about 199 KB script, plus the WebView |

The frame rate counts the JS thread, not the WebView's own rendering, so it shows that updates do not starve the app, not how smooth the chart is. The Skia frame rate was not measured; the decision does not rest on it.

## Decision

Use Lightweight Charts in a WebView, behind a chart port like the web one, so the screen does not know the library.

Skia would give native control, but axes, labels, a price line, scaling and any later crosshair would all be our code, to maintain beside the web chart's behaviour. The WebView chart is already the behaviour the web ships.

## Consequences

- **Accessibility.** A WebView canvas is opaque to screen readers. The chart gets a native text summary beside it (`summarizeHistory`), and the chart itself is not the accessible content.
- **Attribution.** Lightweight Charts requires a notice. The WebView shows the library's logo, and the screen shows `attribution.chartNotice`, as on the web.
- **Locale.** The spike's time axis showed Arabic-Indic digits because the page took the phone's locale. The chart must be given the app's language explicitly so numerals follow the app, not the device.
- **Data crosses a bridge.** Candles and updates are sent as JSON messages, so the port sends the full history once and then single-candle updates.
- **Not verified:** iOS, and the WebView's own frame rate under load.
- `victory-native` was not run; the reasons above were read from its documentation and the Expo SDK's pinned versions.
