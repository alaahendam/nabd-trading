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
