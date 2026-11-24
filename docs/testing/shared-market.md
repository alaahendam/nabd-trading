# Test matrix: shared market contracts

Modules: `packages/shared/src/period.ts` and `packages/shared/src/market.ts`.

## Purpose and public surface

- `PERIODS`, `periodSchema`, `Period`, `PERIOD_CONFIG`, `DEFAULT_PERIOD`: the closed set of chart periods and, for each, how far back it looks and how wide one bucket is.
- `symbolSchema`: ticker format. `stockSchema`: static facts about a stock.
- `quoteSchema`: current price, previous close, OHLC, volume and change. Refined so OHLC and change are internally consistent.
- `priceTickSchema`: one realtime update. `historyPointSchema`: one OHLCV candle, refined for consistency.
- `stockWithQuoteSchema`, `historyDataSchema`, `historyQuerySchema`, `dataEnvelope`: response and query shapes for the stocks endpoints.
- All times are epoch milliseconds (integers). All prices are positive numbers.

## Cases: period

| ID     | Case                                         | Input / setup              | Expected                            | Level |
| ------ | -------------------------------------------- | -------------------------- | ----------------------------------- | ----- |
| PER-01 | Period values are the agreed closed set      | `PERIODS`                  | `1D 1W 1M 3M 1Y` in that order      | unit  |
| PER-02 | Schema accepts every period                  | each value                 | parses to itself                    | unit  |
| PER-03 | Schema rejects anything else                 | `2D`, `1d`, `''`, `5`      | validation error                    | unit  |
| PER-04 | Config exists for every period               | `PERIOD_CONFIG`            | one entry per period, no extras     | unit  |
| PER-05 | Bucket divides lookback evenly               | each config                | `lookbackMs % bucketMs === 0`       | unit  |
| PER-06 | Bucket is positive and smaller than lookback | each config                | `0 < bucketMs < lookbackMs`         | unit  |
| PER-07 | Longer periods look further back             | configs in `PERIODS` order | `lookbackMs` strictly increasing    | unit  |
| PER-08 | Default period is a valid period             | `DEFAULT_PERIOD`           | accepted by `periodSchema`, is `1D` | unit  |

## Cases: market

| ID     | Case                                             | Input / setup                                                            | Expected                                                          | Level |
| ------ | ------------------------------------------------ | ------------------------------------------------------------------------ | ----------------------------------------------------------------- | ----- |
| MKT-01 | Valid symbols                                    | `AAPL`, `F`, `BRK.B`                                                     | accepted                                                          | unit  |
| MKT-02 | Invalid symbols                                  | `''`, `aapl`, `TOOLONG`, `A.`, `AAPL.BB`, `A B`                          | rejected                                                          | unit  |
| MKT-03 | Valid stock                                      | all fields                                                               | parses; unknown keys are stripped                                 | unit  |
| MKT-04 | Invalid stock                                    | bad exchange, empty name, empty sector, currency `EUR`, missing field    | rejected, error on that field                                     | unit  |
| MKT-05 | Valid quote                                      | consistent OHLC and change                                               | parses                                                            | unit  |
| MKT-06 | Quote number rules                               | price `0`, negative, `NaN`, `Infinity`; volume `-1`, `1.5`               | rejected on that field                                            | unit  |
| MKT-07 | High below the price or open                     | `high < price`, `high < open`                                            | rejected, issue path `high`                                       | unit  |
| MKT-08 | Low above the price or open                      | `low > price`, `low > open`                                              | rejected, issue path `low`                                        | unit  |
| MKT-09 | Change disagrees with price minus previous close | `change` off by more than a cent                                         | rejected, issue path `change`                                     | unit  |
| MKT-10 | Change percent disagrees with change             | `changePercent` off by more than a hundredth                             | rejected, issue path `changePercent`                              | unit  |
| MKT-11 | Cent rounding is tolerated                       | change and percent rounded to 2 decimals                                 | accepted                                                          | unit  |
| MKT-12 | Valid tick                                       | symbol, price, volume, timestamp                                         | parses                                                            | unit  |
| MKT-13 | Invalid tick                                     | bad symbol, price `0`, negative or fractional timestamp, negative volume | rejected                                                          | unit  |
| MKT-14 | Valid history point                              | consistent candle                                                        | parses                                                            | unit  |
| MKT-15 | Candle high below open or close                  | `high < open`, `high < close`                                            | rejected, issue path `high`                                       | unit  |
| MKT-16 | Candle low above open or close                   | `low > open`, `low > close`                                              | rejected, issue path `low`                                        | unit  |
| MKT-17 | Stock with quote                                 | matching symbols                                                         | parses                                                            | unit  |
| MKT-18 | Stock and quote symbols disagree                 | `AAPL` stock, `MSFT` quote                                               | rejected, issue path `quote.symbol`                               | unit  |
| MKT-19 | History data                                     | ascending times                                                          | parses                                                            | unit  |
| MKT-20 | History points out of order or duplicated        | descending, equal times                                                  | rejected, issue path `points`                                     | unit  |
| MKT-21 | History data with no points                      | `points: []`                                                             | accepted (an empty window is valid)                               | unit  |
| MKT-22 | History query defaults the period                | `{}`                                                                     | `period` is the default                                           | unit  |
| MKT-23 | History query rejects an unknown period          | `{ period: '2D' }`                                                       | rejected                                                          | unit  |
| MKT-24 | Envelope wraps any schema                        | `dataEnvelope(stockSchema)`                                              | accepts `{ data: stock }`, rejects bare stock and `{ data: bad }` | unit  |
| MKT-25 | Response schemas wrap their payload              | stocks, stock and history responses                                      | accept `{ data }`, reject the bare payload                        | unit  |

## Coverage target

100% statements, branches, functions and lines for `packages/shared` (enforced in `vitest.config.ts`). There are no exclusions: every file is a contract.

## Out of scope

The stock universe, price generation and history generation (server, Phase 3). Watchlist, errors, routes and socket contracts have their own matrices (`shared-api.md`, `shared-socket.md`).
