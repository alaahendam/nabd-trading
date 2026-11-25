# Stock chart: test matrix

Scope: `features/stocks` chart: `candles.ts` (pure math, now in `packages/domain/src` with `chart-summary.ts` and `custom-range.ts`, shared with the mobile app), `chart-colors.ts`, `lightweight-chart-adapter.ts` (glue to the library, tested with the library mocked), `chart-loader.ts`, `chart-context.tsx`, and `StockChart` (with the period switcher). Component tests use a fake `ChartPort`, so no canvas is needed; the real chart is checked in a browser.

Times: the API gives milliseconds; the library wants seconds (`UTCTimestamp`), so conversion happens in `candles.ts` and nowhere else.

## candles.ts (`@nabd/domain`)

| ID     | Behavior                         | Input                                                    | Expected                                                                               | Level |
| ------ | -------------------------------- | -------------------------------------------------------- | -------------------------------------------------------------------------------------- | ----- |
| CND-01 | History becomes candles          | two points in milliseconds                               | candles with `time` in seconds and the same open, high, low, close                     | unit  |
| CND-02 | Volume bars                      | a rising, a falling and a flat (close equals open) point | `up`, `down`, `up`, with the point's volume and time in seconds                        | unit  |
| CND-03 | Empty history                    | no points                                                | no candles and no bars                                                                 | unit  |
| CND-04 | A live price inside the candle   | last candle, a price and a timestamp within its bucket   | same time and open; close is the price; high and low widen if the price is beyond them | unit  |
| CND-05 | A live price below the low       | price under the candle's low                             | low is the price, high unchanged                                                       | unit  |
| CND-06 | A live price in a later bucket   | timestamp past the bucket end                            | a new candle at the start of its bucket, with open, high, low and close all the price  | unit  |
| CND-07 | A live price older than the last | timestamp before the candle's start                      | treated as inside the last candle, never an earlier one                                | unit  |
| CND-08 | No candle yet                    | no last candle, a price                                  | a new candle at the bucket start of the timestamp                                      | unit  |

## chart-colors.ts

| ID     | Behavior                        | Input                                       | Expected                                                                 | Level |
| ------ | ------------------------------- | ------------------------------------------- | ------------------------------------------------------------------------ | ----- |
| CLR-01 | Colors come from the CSS tokens | a style that returns values with whitespace | background, text, muted, grid, up and down read from the tokens, trimmed | unit  |

## lightweight-chart-adapter.ts (library mocked)

| ID     | Behavior                     | Input                                       | Expected                                                                                                         | Level |
| ------ | ---------------------------- | ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | ----- |
| ADP-01 | Creates the chart and series | `createLightweightChart(container, colors)` | a chart on the container that resizes itself, with the attribution logo on, a candlestick and a histogram series | unit  |
| ADP-02 | Sets data and fits the view  | candles and volume bars                     | the series get the data (volume colored by direction) and the time scale fits the content                        | unit  |
| ADP-03 | Updates the last candle      | a candle                                    | the candlestick series updates with it                                                                           | unit  |
| ADP-04 | Applies colors               | `ChartColors`                               | chart layout and grid, and candle and volume colors, change                                                      | unit  |
| ADP-05 | Disposes                     | `dispose()`                                 | the chart is removed                                                                                             | unit  |
| ADP-06 | The loader loads the adapter | `loadLightweightChart(container, colors)`   | resolves a port made by the adapter module, imported on demand                                                   | unit  |

## StockChart

| ID     | Behavior                              | Input                                        | Expected                                                                                           | Level     |
| ------ | ------------------------------------- | -------------------------------------------- | -------------------------------------------------------------------------------------------------- | --------- |
| CHT-01 | One chart per mount                   | mount, then unmount                          | the loader is called once with the container; the port is disposed once                            | component |
| CHT-02 | Loads the default period              | mount                                        | `getHistory('AAPL', '1D')`; the port gets that history as candles and volume                       | component |
| CHT-03 | Period switcher                       | press 1W                                     | `getHistory('AAPL', '1W')`; the port gets the new data; the 1W button is pressed                   | component |
| CHT-04 | Loading                               | history pending                              | a busy status named "Loading chart…"                                                               | component |
| CHT-05 | History error and retry               | a 400 failure, then success                  | an alert with retry; pressing it loads the data into the port                                      | component |
| CHT-06 | No data                               | history with no points                       | "No chart data for this period"                                                                    | component |
| CHT-07 | A live tick moves the last candle     | connect, tick AAPL                           | the port's `updateCandle` gets the last candle with the tick's price as its close                  | component |
| CHT-08 | Other symbols and no data are ignored | tick MSFT; a tick before the history arrives | `updateCandle` is not called                                                                       | component |
| CHT-09 | Theme colors                          | mount; then switch to dark                   | the loader gets the colors read from the tokens; `applyColors` is last called with the dark colors | component |
| CHT-10 | Unmount before the chart loads        | unmount while the loader is pending          | the port is disposed as soon as it arrives                                                         | component |
| CHT-11 | Accessible and left to right          | any                                          | the chart area is an image with a label naming the symbol and period, and `dir="ltr"`              | component |
| CHT-12 | Arabic                                | `ar`                                         | period buttons have Arabic names; the codes stay Latin                                             | component |
| CHT-13 | The chart library fails to load       | the loader rejects; then succeeds            | an alert "Could not load the chart" with retry; pressing it creates the chart                      | component |
| CHT-14 | A tick in the period's next bucket    | a tick past the last candle's bucket         | `updateCandle` gets a new candle at the bucket start                                               | component |
| CHT-15 | A late library failure is ignored     | the loader rejects after unmount             | no state change and nothing disposed                                                               | component |
| CHT-16 | The loader needs its provider         | `useChartLoader` outside `ChartProvider`     | an error naming `ChartProvider`                                                                    | component |

## Chart language

| ID     | Behavior                              | Input                                 | Expected                                                                                      | Level     |
| ------ | ------------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------- | --------- |
| CLC-01 | The chart locale follows the language | `en`, `ar` and anything else          | `en-US`; `ar-u-nu-latn` (Arabic names, Latin digits); `en-US`                                 | unit      |
| ADP-07 | The adapter applies a locale          | `applyLocale('ar-u-nu-latn')`         | the chart's localization locale changes, and the one given at creation is used from the start | unit      |
| CHT-17 | The chart starts in the app language  | mount in English; mount in Arabic     | the loader is given `en-US`; `ar-u-nu-latn`                                                   | component |
| CHT-18 | A language change reaches the chart   | switch the app from English to Arabic | `applyLocale` is called with `ar-u-nu-latn`, without creating a second chart                  | component |

## Text alternative

The chart is a labelled figure; its description gives the numbers behind the picture. It is read from the loaded history (not from live ticks), so it is still while prices move, and it follows the period and the language.

| ID     | Behavior                                  | Input                                             | Expected                                                                              | Level     |
| ------ | ----------------------------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------- | --------- |
| SUM-01 | Nothing to say about no candles           | `[]`                                              | no summary                                                                            | unit      |
| SUM-02 | Start and end                             | two candles                                       | the first open and the last close                                                     | unit      |
| SUM-03 | High and low                              | three candles with the extremes in the middle one | the highest high and the lowest low of all candles                                    | unit      |
| SUM-04 | Change                                    | open 200, close 205; open 200, close 150          | `+2.5`, `-25` (percent)                                                               | unit      |
| SUM-05 | No division by zero                       | open 0                                            | `0`                                                                                   | unit      |
| CHT-22 | The chart is described                    | the default period                                | description: period, from, to, up 1.32%, high, low                                    | component |
| CHT-23 | The description follows the period        | switch to 1W                                      | it starts with "Past week"                                                            | component |
| CHT-24 | Down is said in words                     | a candle that falls 25%                           | "down 25.00%", with no minus sign                                                     | component |
| CHT-25 | Unchanged is said in words                | a move that rounds to nothing                     | "unchanged"                                                                           | component |
| CHT-26 | Arabic, with Latin digits                 | the Arabic app                                    | `اليوم الماضي: من $228.00 إلى $231.00، ارتفاع 1.32%. الأعلى $232.00، الأدنى $227.00.` | component |
| CHT-27 | A custom range is named by its dates      | apply the default custom range                    | the description starts with the two dates                                             | component |
| CHT-28 | No description while there is nothing yet | loading; an empty history                         | no `aria-describedby`                                                                 | component |
