# Stock detail header and stats: test matrix

Scope: `features/stocks` detail: `StockDetail` (header, live price, stats, states) and the day high and low in `useLiveQuote`. The chart is covered in `web-stock-chart.md`. Same harness as the list.

## useLiveQuote additions

| ID    | Behavior                         | Input                                                       | Expected                                                               | Level |
| ----- | -------------------------------- | ----------------------------------------------------------- | ---------------------------------------------------------------------- | ----- |
| LQ-06 | The day range widens with a tick | quote high 231, low 227.5; ticks at 233, then 225, then 229 | high 233 then 233 then 233; low 227.5 then 225 then 225; never narrows | hook  |

## PriceFlash addition

| ID    | Behavior   | Input   | Expected                                | Level     |
| ----- | ---------- | ------- | --------------------------------------- | --------- |
| PF-04 | Large size | `large` | the price is larger; the default is not | component |

## StockDetail

| ID     | Behavior                                        | Input                                                   | Expected                                                                                    | Level     |
| ------ | ----------------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------- | --------- |
| DET-01 | Loading                                         | the request is pending                                  | a busy status named "Loading stock…" and no heading                                         | component |
| DET-02 | Header                                          | AAPL loaded                                             | a level 1 heading `AAPL`, the name, the exchange and sector, the price and the change badge | component |
| DET-03 | Live price                                      | connect, tick at 235 with volume 2000                   | price `$235.00`, change against the previous close, volume from the tick                    | component |
| DET-04 | Stats                                           | AAPL loaded                                             | open, high, low, previous close in dollars and the volume compact, each with its label      | component |
| DET-05 | The range follows the live price                | a tick above the day high                               | the high shows the new price                                                                | component |
| DET-06 | Subscribes to its symbol only                   | connect; then the screen leaves                         | one subscribe with that symbol; one unsubscribe after it is hidden                          | component |
| DET-07 | Error and retry                                 | a 400 failure (permanent, so not retried by the client) | an alert with a retry button; pressing it loads the stock                                   | component |
| DET-08 | Not found                                       | a 404 error                                             | "Stock not found" naming the symbol and a link back to the list; no retry button            | component |
| DET-09 | Action slot                                     | `renderAction`                                          | its output appears in the header, called with the symbol                                    | component |
| DET-10 | Arabic                                          | `ar`                                                    | Arabic labels; prices, change and volume still Latin digits and left to right               | component |
| DET-11 | Stale price                                     | tick, then 11 s of silence                              | the "Delayed" label shows                                                                   | component |
| DET-12 | A failed refresh keeps the page                 | loaded, then the next request fails                     | the stock stays and no error replaces it                                                    | component |
| DET-13 | English names stay in their own order in Arabic | the Arabic app                                          | the name and the "exchange · sector" line are each wrapped in `<bdi>`                       |
