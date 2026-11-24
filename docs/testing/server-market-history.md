# Test matrix: history generator

Module: `apps/server/src/modules/market/history.ts`. Design: ADR 0004.

## Purpose and public surface

- `generateHistory(entry, period, now, currentPrice)`: a `HistoryData` of OHLCV candles for the period, aligned to buckets, ending with a candle whose close is exactly the current price.
- `dayRegime(symbol, dayIndex)`: the volatility regime of one UTC day (volatility clusters within a day).

Every candle is a pure function of (symbol, bucket index) and the current price. The path is built backward from the current price, so repeated requests return the same history shape, shifted as time passes. A larger "overnight gap" return is added at each UTC day boundary, so a candle that starts a day opens away from the previous close; inside a day each candle opens at the previous close.

## Cases

| ID     | Case                                           | Input / setup                                                              | Expected                                                                                                                                           | Level |
| ------ | ---------------------------------------------- | -------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ----- |
| HIS-01 | Point count, alignment and order               | every period                                                               | `lookbackMs / bucketMs` points; times ascend by exactly one bucket, are multiples of the bucket, and the last is the bucket containing `now`       | unit  |
| HIS-02 | Valid for every stock and period               | all universe stocks x all periods                                          | passes the shared `historyDataSchema`                                                                                                              | unit  |
| HIS-03 | Ends at the current price                      | prices `0.05`, `23.5`, `1234.56`                                           | the last close equals the price exactly                                                                                                            | unit  |
| HIS-04 | Deterministic and symbol-specific              | same inputs twice; another symbol                                          | identical; different                                                                                                                               | unit  |
| HIS-05 | Same shape at another price level              | price 100 versus 200                                                       | every close divided by the last close agrees within 1%                                                                                             | unit  |
| HIS-06 | Stable while time moves within a bucket        | `now` and `now + 1 s` (same bucket)                                        | identical history                                                                                                                                  | unit  |
| HIS-07 | Stable when a new bucket starts                | `now` and `now` one bucket later, 1M                                       | per-candle log returns of the overlapping candles agree within rounding                                                                            | unit  |
| HIS-08 | Day gaps at UTC boundaries                     | 1W                                                                         | inside a day each open is the previous close (within a cent); at least one day-start candle opens away from the previous close by more than a cent | unit  |
| HIS-09 | Volume is positive and day volume is realistic | 1W                                                                         | integers above zero; a full day's volume within 15% of the stock's average daily volume                                                            | unit  |
| HIS-10 | Volatility is realistic                        | 2-hour candles of AAPL for 1M (30 day regimes), day-start candles excluded | standard deviation of log returns between 0.8 and 1.45 times `dailyVolatility * sqrt(bucket / day)`                                                | unit  |
| HIS-11 | Prices are cents and at least one cent         | all points of all periods of a penny stock                                 | every OHLC value has at most two decimals and is at least `0.01`                                                                                   | unit  |
| HIS-12 | Bucket boundary handling                       | `now` exactly on a boundary; one millisecond before it                     | last candle starts at `now`; last candle starts one bucket earlier                                                                                 | unit  |
| HIS-13 | Day regime                                     | many days for one symbol; two symbols                                      | deterministic, always within [0.6, 2], varies across days, differs by symbol                                                                       | unit  |
| HIS-14 | Bad inputs are rejected                        | price `0`, `-1`, `NaN`; `now` earlier than the lookback                    | throws `RangeError`                                                                                                                                | unit  |

Note on HIS-10: the expected ratio is the root mean square of the day regime (about 1.13). Across 84 stock and date combinations it ranged from 0.95 to 1.35, so the bounds are about three standard errors around 1.13, not a fit to one result.

## Coverage target

100% statements, branches, functions and lines for `history.ts` (per-file threshold in `vitest.config.ts`).

## Out of scope

Serving history over HTTP (stocks module) and the live simulator.

## Custom ranges and `bucketMs` (design polish)

`generateRangeHistory(entry, { from, to }, now, currentPrice)` serves any range from the same deterministic walk as the fixed periods: the path is built backward from the current price at `now`, and only the candles inside the range are returned.

| ID     | Behavior                                           | Input                                                                                                 | Expected                                                                                                                                                          | Level |
| ------ | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- |
| HIS-15 | Every history names its candle size                | each period                                                                                           | `bucketMs` equals the period's configured size                                                                                                                    | unit  |
| HIS-16 | A range returns the candles inside it              | a 3-day range ending two days ago                                                                     | `period` is `custom`; `bucketMs` is 30 min; candle times are aligned, ascending, from the one holding `from` to the one holding `to`; valid per the shared schema | unit  |
| HIS-17 | A range ending now agrees with the period          | `{ now - 7 d, now }` against the 1W period                                                            | the same candles for the same times (the range has one extra candle at the start)                                                                                 | unit  |
| HIS-18 | A candle is the same whichever way it is asked for | the last two hours as a range against the 1D period                                                   | identical candles for the shared times                                                                                                                            | unit  |
| HIS-19 | A range ending now ends at the current price       | `to` equal to `now`                                                                                   | the last close is the current price exactly                                                                                                                       | unit  |
| HIS-20 | A one-hour range uses 5-minute candles             | a range of one hour                                                                                   | 5-minute candles, 12 or 13 of them                                                                                                                                | unit  |
| HIS-21 | Bad ranges are refused                             | `to` after `now`; `from` older than a year; a span under an hour; over a year; `from` not before `to` | throws `RangeError`                                                                                                                                               | unit  |

`rangeProblem(range, now)` returns a sentence naming what is wrong with a range, or `undefined`; the generator throws it as a `RangeError` and the service as a `VALIDATION_ERROR`, so the rules live in one place.

| ID     | Behavior                               | Input                        | Expected                                                          | Level |
| ------ | -------------------------------------- | ---------------------------- | ----------------------------------------------------------------- | ----- |
| SVC-06 | The service serves a range             | a symbol and a past range    | `custom` history that passes the shared schema                    | unit  |
| SVC-07 | An unknown symbol has no range history | `NOPE` and a range           | `undefined`                                                       | unit  |
| SVC-08 | A bad range is a validation error      | a range ending in the future | an `ApiException` with code `VALIDATION_ERROR` naming the problem | unit  |
