# Test matrix: market service, clock and stocks REST

Modules: `src/common/clock.ts`, `src/modules/market/market.service.ts` (and `market.module.ts`, `index.ts`), `src/modules/stocks`.

## Purpose and public surface

- `Clock` / `CLOCK` / `SystemClock`: time source injected everywhere, so tests control time.
- `MarketService`: owns one `MarketSimulator`, steps it on a timer, publishes each step's ticks on `ticks$` (an Observable of `PriceTick[]` batches), and answers `stocks()`, `stock(symbol)`, `history(symbol, period)`, `latestTick(symbol)`, `hasSymbol(symbol)`. Options (seed, volatility scale, step interval) come from the environment through the `MARKET_OPTIONS` provider.
- `GET /api/stocks`, `GET /api/stocks/:symbol`, `GET /api/stocks/:symbol/history?period=`: thin controllers. Symbols and periods are validated with the shared schemas; every success body matches the shared response schema.

## Cases: env (additions to `server-env.md`)

| ID     | Case                                        | Input / setup                   | Expected                                         | Level |
| ------ | ------------------------------------------- | ------------------------------- | ------------------------------------------------ | ----- |
| ENV-15 | `MARKET_SEED` defaults and accepts a string | `{}`, `MARKET_SEED=abc`         | `nabd`; `abc`                                    | unit  |
| ENV-16 | `SIM_VOLATILITY_SCALE` is a positive number | `{}`, `2.5`, `0`, `-1`, `abc`   | default `3`, `2.5` accepted; the rest rejected   | unit  |
| ENV-17 | `SIM_STEP_MS` is an integer from 10 to 5000 | `{}`, `250`, `9`, `5001`, `1.5` | default `100`, `250` accepted; the rest rejected | unit  |

## Cases: clock and service

| ID     | Case                                    | Input / setup                                            | Expected                                                                                            | Level |
| ------ | --------------------------------------- | -------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | ----- |
| CLK-01 | The system clock tells the time         | `SystemClock.now()`                                      | within a second of `Date.now()`                                                                     | unit  |
| SVC-01 | Same options, same market               | two services, same seed and clock                        | identical quotes; a different seed differs                                                          | unit  |
| SVC-02 | Timer steps the simulator and publishes | fake timers, `onModuleInit`, advance the clock and timer | one batch of valid ticks per step; after `onModuleDestroy` no more batches and the stream completes | unit  |
| SVC-03 | No ticks, no publication                | `step()` without the clock moving                        | nothing emitted                                                                                     | unit  |
| SVC-04 | Stocks with quotes                      | `stocks()`, `stock('AAPL')`, `stock('NOPE')`             | every item passes `stockWithQuoteSchema`, one per universe stock; unknown gives `undefined`         | unit  |
| SVC-05 | History                                 | every period for a known symbol; unknown symbol          | passes `historyDataSchema`, last close equals the current price; unknown gives `undefined`          | unit  |
| SVC-06 | Lookups                                 | `hasSymbol`, `latestTick`, `symbols`                     | true/false, a valid tick or `undefined`, the universe symbols                                       | unit  |
| SVC-07 | Latest ticks of several symbols         | `latestTicks(['MSFT', 'NOPE', 'AAPL'])`, `[]`            | valid ticks for the known symbols in the given order; `[]` for none                                 | unit  |

## Cases: HTTP

| ID     | Case                                     | Input / setup                        | Expected                                                                           | Level |
| ------ | ---------------------------------------- | ------------------------------------ | ---------------------------------------------------------------------------------- | ----- |
| STK-01 | List stocks                              | `GET /api/stocks`                    | 200, passes `stocksResponseSchema`, one item per universe stock                    | e2e   |
| STK-02 | One stock                                | `GET /api/stocks/AAPL`               | 200, passes `stockResponseSchema`, symbol `AAPL`                                   | e2e   |
| STK-03 | A dotted symbol                          | `GET /api/stocks/BRK.B`              | 200 for `BRK.B`                                                                    | e2e   |
| STK-04 | Unknown symbol                           | `GET /api/stocks/NOPE`               | 404, code `NOT_FOUND`                                                              | e2e   |
| STK-05 | Malformed symbol                         | `GET /api/stocks/aapl`               | 422, code `VALIDATION_ERROR` with details                                          | e2e   |
| STK-06 | History defaults to 1D                   | `GET /api/stocks/AAPL/history`       | 200, passes `historyResponseSchema`, period `1D`                                   | e2e   |
| STK-07 | History for every period                 | `?period=` each of `1D 1W 1M 3M 1Y`  | point count equals lookback over bucket; last close within 2% of the stock's price | e2e   |
| STK-08 | Bad period and unknown symbol on history | `?period=2D`; `/stocks/NOPE/history` | 422 `VALIDATION_ERROR`; 404 `NOT_FOUND`                                            | e2e   |

## Coverage target

100% for `common/clock.ts` and `market.service.ts` (per-file threshold for the service); controllers are covered by the HTTP cases.

## Out of scope

Broadcasting ticks to sockets (realtime module), chaos behavior, identity and the watchlist.

## Paging and filtering the list (design polish)

`stocks.pagination.ts` is a pure function over the ordered list; the controller only calls it.

| ID     | Behavior                                  | Input                                                                    | Expected                                                                                     | Level |
| ------ | ----------------------------------------- | ------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------- | ----- |
| PAG-01 | No limit means everything                 | 5 stocks, `{}`                                                           | all 5 in order, `nextCursor` null, `total` 5                                                 | unit  |
| PAG-02 | A limit returns a page and a cursor       | 5 stocks, `limit` 2                                                      | the first 2, `nextCursor` the symbol of the second, `total` 5                                | unit  |
| PAG-03 | The cursor continues after that symbol    | `limit` 2 with the cursor from page one, then page two's cursor          | the next 2, then the last 1 with `nextCursor` null                                           | unit  |
| PAG-04 | A limit that ends exactly at the end      | `limit` 5 on 5 stocks; `limit` 2 with cursor of the third                | a full last page has `nextCursor` null; no empty extra page                                  | unit  |
| PAG-05 | A cursor without a limit                  | cursor of the second                                                     | everything after it, `nextCursor` null                                                       | unit  |
| PAG-06 | An unknown cursor is refused              | cursor `ZZZ`                                                             | a `VALIDATION_ERROR` naming the cursor                                                       | unit  |
| PAG-07 | The symbols filter keeps list order       | `symbols` `['MSFT','AAPL']` on a list ordered AAPL, MSFT                 | AAPL then MSFT, `nextCursor` null, `total` 2                                                 | unit  |
| PAG-08 | Unknown symbols in the filter are skipped | `symbols` `['AAPL','ZZZ']`                                               | only AAPL, `total` 1                                                                         | unit  |
| PAG-09 | The filter ignores paging                 | `symbols` with `limit` 1 and a cursor                                    | all matches, `nextCursor` null: a filtered list is not paged                                 | unit  |
| STK-09 | Paged list over HTTP                      | `GET /api/stocks?limit=10`, then each `nextCursor`                       | pages of 10, 10, 1 that together equal the universe in order; the last has `nextCursor` null | e2e   |
| STK-10 | Filtered list over HTTP                   | `GET /api/stocks?symbols=NVDA,AAPL`                                      | the two stocks in list order                                                                 | e2e   |
| STK-11 | Bad paging input over HTTP                | `?limit=0`, `?limit=101`, `?cursor=aapl`, `?cursor=ZZZ`, `?symbols=aapl` | 422 `VALIDATION_ERROR` for each                                                              | e2e   |

## Custom history range over HTTP (design polish)

| ID     | Behavior                              | Input                                                                                                        | Expected                                                                                                    | Level |
| ------ | ------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------- | ----- |
| STK-12 | A custom range                        | `GET /api/stocks/AAPL/history?from=<3 days ago>&to=<1 day ago>` in milliseconds                              | 200, passes `historyResponseSchema`, `period` `custom`, 30-minute candles, ascending times inside the range | e2e   |
| STK-13 | A bad range                           | `to` in the future; `from` over a year ago; a span under an hour; only `from`; `period` with `from` and `to` | 422 `VALIDATION_ERROR` for each                                                                             | e2e   |
| STK-14 | A period answers with its candle size | `?period=1W`                                                                                                 | `bucketMs` is 30 minutes and `period` is `1W`                                                               | e2e   |
| STK-15 | An unknown symbol with a valid range  | `/api/stocks/NOPE/history?from=..&to=..`                                                                     | 404 `NOT_FOUND`                                                                                             | e2e   |
