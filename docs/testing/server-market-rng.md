# Test matrix: seeded RNG and stock universe

Modules: `apps/server/src/modules/market/rng.ts` and `universe.ts`.

## Purpose and public surface

- `hashString(text)`: stable 32-bit FNV-1a hash, used to turn names into seeds.
- `createRng(seed)`: a seeded generator (mulberry32) with `next()` in `[0, 1)`, `normal()` (standard normal, Box-Muller) and `exponential(rate)`. A string seed is hashed first.
- `rngFor(...parts)`: a generator keyed by the parts (for example symbol and bucket index). The history generator uses it so every candle is a pure function of its inputs.
- `STOCK_UNIVERSE`: real tickers with an approximate, illustrative snapshot price and simulation parameters (`beta`, `dailyVolatility`, `avgDailyVolume`, `ticksPerSecond`). Prices are not quotes; the UI labels the data as simulated.
- `getUniverseEntry(symbol)`, `toStock(entry)`: lookup, and projection to the public `Stock` contract.

## Cases: RNG

| ID     | Case                                                            | Input / setup                                         | Expected                                                      | Level |
| ------ | --------------------------------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------- | ----- |
| RNG-01 | Same seed gives the same sequence                               | two generators, seed `42`, 100 draws                  | identical                                                     | unit  |
| RNG-02 | Different seeds differ                                          | seeds `1` and `2`                                     | first 10 draws are not all equal                              | unit  |
| RNG-03 | `next` stays in `[0, 1)`                                        | 10 000 draws                                          | every value `>= 0` and `< 1`                                  | unit  |
| RNG-04 | A string seed is its hash                                       | `createRng('abc')` and `createRng(hashString('abc'))` | identical sequences                                           | unit  |
| RNG-05 | `hashString` matches known FNV-1a values                        | `''`, `'a'`                                           | `2166136261` and `3826002220`                                 | unit  |
| RNG-06 | `hashString` differs by input and is an unsigned 32-bit integer | several strings                                       | distinct values, integers from `0` to `2^32 - 1`              | unit  |
| RNG-07 | `normal` is standard normal                                     | 20 000 draws                                          | mean within 0.05 of 0, standard deviation within 0.05 of 1    | unit  |
| RNG-08 | `normal` is always finite                                       | 20 000 draws                                          | never `NaN` or infinite                                       | unit  |
| RNG-09 | `exponential` has mean `1 / rate`                               | rate `4`, 20 000 draws                                | mean within 0.02 of `0.25`; every draw `> 0`                  | unit  |
| RNG-10 | `exponential` rejects a bad rate                                | `0`, `-1`, `NaN`                                      | throws `RangeError`                                           | unit  |
| RNG-11 | `rngFor` is keyed by its parts                                  | same parts twice; different parts                     | same parts: identical draws; different parts: different draws | unit  |

## Cases: universe

| ID     | Case                                                   | Input / setup         | Expected                                                                                                                       | Level |
| ------ | ------------------------------------------------------ | --------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ----- |
| UNI-01 | Symbols are unique                                     | `STOCK_UNIVERSE`      | no duplicates                                                                                                                  | unit  |
| UNI-02 | Every entry is a valid public stock                    | each `toStock(entry)` | passes the shared `stockSchema`, equals the entry's public fields only                                                         | unit  |
| UNI-03 | Simulation parameters are sane                         | each entry            | price `> 0` and in cents; `beta` in `(0, 3)`; `dailyVolatility` in `(0, 0.1)`; volume a positive integer; `ticksPerSecond > 0` | unit  |
| UNI-04 | The universe covers both exchanges and a dotted symbol | `STOCK_UNIVERSE`      | contains `NASDAQ`, `NYSE` and a symbol with `.`                                                                                | unit  |
| UNI-05 | Lookup finds known and rejects unknown symbols         | `AAPL`, `NOPE`        | entry / `undefined`                                                                                                            | unit  |
| UNI-06 | The universe is large enough for a market view         | `STOCK_UNIVERSE`      | at least 20 stocks and no more than the 50 a socket may subscribe to                                                           | unit  |

## Coverage target

100% statements, branches, functions and lines for `rng.ts` and `universe.ts` (per-file threshold in `vitest.config.ts`).

## Out of scope

Price stepping (`simulator.ts`) and candles (`history.ts`) have their own matrices.
