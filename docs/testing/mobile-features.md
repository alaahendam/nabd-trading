# Mobile features: test matrix (M3)

Written before the code. IDs appear in the test names. jest-expo with React Native Testing Library; the API is `createFakeApi`, the socket is `FakeSocket` (both from `@nabd/testing`), so no test touches the network. The chart section is completed after the chart spike (T6).

## Live quote

| ID    | Behaviour                                                                                  |
| ----- | ------------------------------------------------------------------------------------------ |
| LQ-01 | With no live price, the quote's own price is used                                          |
| LQ-02 | A live price replaces the quote's price                                                    |
| LQ-03 | Change and percent come from the live price and the previous close, so they agree          |
| LQ-04 | Direction is flat until two ticks arrived, then up or down by the last move                |
| LQ-05 | The day's high and low widen when the live price goes beyond them                          |
| LQ-06 | Freshness is `stale` when the connection is not live, and `fresh` after a tick while it is |

## Row

| ID     | Behaviour                                                                                         |
| ------ | ------------------------------------------------------------------------------------------------- |
| ROW-01 | A row shows the symbol, the name, the price and the change                                        |
| ROW-02 | The change has a sign and is announced as up, down or unchanged, not by color alone               |
| ROW-03 | A price that is not fresh says "Delayed"                                                          |
| ROW-04 | A recycled row (the same component given another stock) shows only the new stock's data and price |
| ROW-05 | A tick for another symbol does not re-render the row                                              |
| ROW-06 | Pressing a row opens that stock's detail                                                          |
| ROW-07 | The row is one accessible element with a label: symbol, name, price and change                    |

## Stock list

| ID     | Behaviour                                                                           |
| ------ | ----------------------------------------------------------------------------------- |
| LST-01 | While the first page loads, a busy status with skeleton rows shows                  |
| LST-02 | If the first load fails, an error with a retry button shows, and retry loads again  |
| LST-03 | An empty answer shows the empty message                                             |
| LST-04 | A loaded list shows the count and the rows                                          |
| LST-05 | Only the loaded rows are subscribed for live prices                                 |
| LST-06 | Reaching the end of the list loads the next page, once, while there is one          |
| LST-07 | A failed next page shows a message and a retry button, and is not retried by itself |
| LST-08 | Pulling to refresh reloads the list                                                 |
| LST-09 | A refresh that fails after data arrived keeps showing the rows                      |
| LST-10 | The last page shows no loading-more indicator                                       |

## Watchlist

| ID     | Behaviour                                                                                        |
| ------ | ------------------------------------------------------------------------------------------------ |
| WLT-01 | The star is a toggle named "Watch AAPL" whatever its state, with its state announced as selected |
| WLT-02 | Pressing it changes the star at once and tells the server                                        |
| WLT-03 | If the server refuses, the star goes back and a short message says so                            |
| WLT-04 | The star is not usable while the watchlist is still loading                                      |
| WLT-05 | An empty watchlist shows the empty state with an action that opens the stock list                |
| WLT-06 | The watchlist screen shows only watched stocks, and removing one takes it off at once            |
| WLT-07 | If the watchlist cannot be loaded, an error with a retry button shows                            |
| WLT-08 | While the watchlist loads, a busy status shows                                                   |

## Stock detail

| ID     | Behaviour                                                                            |
| ------ | ------------------------------------------------------------------------------------ |
| DET-01 | While the stock loads, a busy status shows                                           |
| DET-02 | An unknown symbol shows "Stock not found" with the symbol and a way back to the list |
| DET-03 | Any other failure shows an error with a retry button                                 |
| DET-04 | A loaded stock shows the symbol, name, exchange and sector, the price and the change |
| DET-05 | It shows open, high, low, previous close and volume, formatted                       |
| DET-06 | A live tick updates the price, the change and the high and low                       |
| DET-07 | The stock is subscribed while the screen is shown, and released when it is left      |
| DET-08 | The star is on the detail and works as in the watchlist                              |
| DET-09 | The symbol in the address is read case-insensitively (`aapl` opens AAPL)             |

## Chart (Lightweight Charts in a WebView, ADR 0013)

| ID     | Behaviour                                                                                |
| ------ | ---------------------------------------------------------------------------------------- |
| CHT-01 | The five periods are buttons, one selected, each at least 48 high, named by their period |
| CHT-02 | Changing the period loads that period's history and updates the text summary             |
| CHT-03 | While history loads, a busy status shows; with no data, the empty message shows          |
| CHT-04 | If history fails, an error with a retry button shows, and the stats above stay           |
| CHT-05 | The text summary says the period, start and end price, change, high and low              |
| CHT-06 | The chart has an accessible label with the symbol and period                             |
| CHT-07 | A period seen before comes from the cache without a second request                       |
| CHT-08 | A live tick updates the last candle                                                      |
| CHT-09 | The chart gets the theme's colors and the app language's locale, and follows changes     |
| CHT-10 | The TradingView notice is shown under the chart                                          |
| CHT-11 | The WebView is hidden from screen readers; the label and the summary are read instead    |
| CHT-12 | The surface sends nothing before the page is ready, then the latest state, in order      |
| CHT-13 | The page holds the library inline and nothing from the network; commands are valid JS    |
| CHT-14 | If the page fails to load, an error with a retry button shows, and retry reloads it      |

Coverage: at least 90% overall; 100% for logic (`useLiveQuote`, list and star behaviour).
