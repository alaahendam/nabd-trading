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
