# Stock list: test matrix

Scope: `features/stocks` list: `useLiveQuote`, `PriceFlash`, `StockRow`, `StockList`. Tests use a fake `Api`, a fake socket and the real price store, inside a harness with i18n, query client, realtime provider and a memory router. English unless a case says Arabic.

## useLiveQuote (REST quote plus live price)

| ID    | Behavior                         | Input                                                                 | Expected                                                                                  | Level |
| ----- | -------------------------------- | --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ----- |
| LQ-01 | No live price yet                | a quote, nothing ticked                                               | price, volume, change and percent come from the quote; direction `flat`; freshness `none` | hook  |
| LQ-02 | A tick takes over                | tick at 235 for a quote with previous close 228                       | price 235, change 7, percent from 228, volume from the tick                               | hook  |
| LQ-03 | Direction                        | two ticks, rising; then falling; then equal                           | `up`, `down`, `flat`                                                                      | hook  |
| LQ-04 | Tick key changes per tick        | two ticks                                                             | the key differs, so the flash can restart                                                 | hook  |
| LQ-05 | Freshness follows the connection | connected with a recent tick; then 11 s of silence; then a disconnect | `fresh`, `stale`, `stale`                                                                 | hook  |

## PriceFlash

| ID    | Behavior                  | Input                            | Expected                                                            | Level     |
| ----- | ------------------------- | -------------------------------- | ------------------------------------------------------------------- | --------- |
| PF-01 | Shows the formatted price | price 1234.5                     | `$1,234.50` in a left-to-right figure                               | component |
| PF-02 | Flash by direction        | `up`, `down`, `flat`             | `data-direction` matches; only up and down carry an animation class | component |
| PF-03 | Stale marker              | `stale`; then `fresh` and `none` | the "Delayed" label shows only when stale                           | component |

## StockRow and StockList

| ID     | Behavior                           | Input                                                 | Expected                                                                                           | Level     |
| ------ | ---------------------------------- | ----------------------------------------------------- | -------------------------------------------------------------------------------------------------- | --------- |
| LST-01 | Loading                            | the request is pending                                | a busy status named "Loading stocks…", skeleton rows, no stock rows                                | component |
| LST-02 | Rows from the quotes               | two stocks                                            | one row each: symbol, name, price, and a change badge from the quote                               | component |
| LST-03 | Live price overrides the quote     | connect, tick AAPL at 235                             | the AAPL row shows `$235.00` and the change against the previous close; the other row is unchanged | component |
| LST-04 | Row links to the detail page       | any row                                               | the symbol link points at `/stocks/<symbol>` (dot kept readable, `BRK.B`)                          | component |
| LST-05 | Subscribes to what it shows        | connect, two stocks; then unmount                     | one subscribe with both symbols; one unsubscribe with both after unmount                           | component |
| LST-06 | A tick re-renders only its own row | tick MSFT                                             | the AAPL row's action slot is not called again                                                     | component |
| LST-07 | Stale price                        | tick, then 11 s of silence                            | the row shows "Delayed"                                                                            | component |
| LST-08 | Error and retry                    | the request fails with a 404; then succeeds           | an alert with a retry button; pressing it loads the rows                                           | component |
| LST-09 | Empty                              | an empty list                                         | an empty status with its title                                                                     | component |
| LST-10 | Symbol filter                      | `symbols=['MSFT']`; and a filter that matches nothing | only that row; the empty status for no match; subscription only for the filtered symbols           | component |
| LST-11 | Action slot                        | `renderAction`                                        | its output appears in every row, called with that symbol                                           | component |
| LST-12 | Count                              | 1, 2 and 11 stocks in English; 2 and 11 in Arabic     | "1 stock", "2 stocks", "11 stocks"; Arabic two and eleven forms                                    | component |
| LST-13 | Arabic                             | `ar`                                                  | Arabic labels; prices and changes still Latin digits and left to right                             | component |
| LST-14 | Flash direction on a live tick     | a rising tick, then a falling one                     | the price element's `data-direction` is `up`, then `down`                                          | component |
| LST-15 | A failed refresh keeps the rows    | rows loaded, then the next request fails              | the rows stay and no error replaces them                                                           | component |

## Paging with infinite scroll (design polish)

| ID     | Behavior                             | Input                                 | Expected                                                                                             | Level     |
| ------ | ------------------------------------ | ------------------------------------- | ---------------------------------------------------------------------------------------------------- | --------- |
| LST-16 | The first page and the total         | the server has 21 stocks, 10 per page | the first request has a limit and no cursor; 10 rows; the header says "21 stocks"                    | component |
| LST-17 | Load more by button                  | press "Load more stocks"              | the next request has the last page's `nextCursor`; the rows are added; the button is gone at the end | component |
| LST-18 | Load more by scrolling               | the button scrolls into view          | the next page loads once; nothing more loads while it is loading or when there is no next page       | component |
| LST-19 | Loading more is shown                | the next page is pending              | the button is disabled, busy and says "Loading…"                                                     | component |
| LST-20 | A failed page keeps the rows         | the next page fails, then succeeds    | the rows stay, an alert says so, the button becomes "Try again" and loads the page                   | component |
| LST-21 | A filtered list is not paged         | `symbols` given                       | one request with the symbols and no limit; no load-more button                                       | component |
| LST-22 | An empty filter asks for nothing     | `symbols` is an empty list            | the empty state, and no request                                                                      | component |
| LST-23 | Subscriptions follow the loaded rows | load a second page                    | the symbols of the new rows are subscribed as well                                                   | component |

## useOnVisible

| ID     | Behavior                              | Input                                             | Expected                                                          | Level     |
| ------ | ------------------------------------- | ------------------------------------------------- | ----------------------------------------------------------------- | --------- |
| OBS-01 | Calls back when the element shows     | an element that intersects                        | the callback runs once per intersection report                    | hook      |
| OBS-02 | Ignores a report of not visible       | an entry that does not intersect                  | no call                                                           | hook      |
| OBS-03 | Does nothing while disabled           | `enabled` false                                   | no observer is created                                            | hook      |
| OBS-04 | Cleans up                             | unmount, or `enabled` turning false               | the observer is disconnected                                      | hook      |
| OBS-05 | Works without observer support        | no `IntersectionObserver` in the environment      | nothing is watched and nothing throws; the button still works     | hook      |
| LST-24 | A failed filtered list can be retried | `symbols` given, the request fails, then succeeds | an alert with a retry button; pressing it shows the filtered rows | component |

## useStockList

| ID     | Behavior                             | Input                                                   | Expected                      | Level |
| ------ | ------------------------------------ | ------------------------------------------------------- | ----------------------------- | ----- |
| SRC-01 | Loading more twice asks once         | `loadMore()` twice while the next page is still loading | one request for the next page | hook  |
| SRC-02 | Loading more at the end does nothing | `loadMore()` when there is no next page                 | no request                    | hook  |
