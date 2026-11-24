# 0004. Market simulation design

- Status: accepted
- Date: 2026-11-24

## Context

Market data is simulated, but the UI should behave like a real market: realistic tickers and prices, per-stock volatility, correlated moves, volatility clustering, irregular tick rates, consistent OHLC and previous close, and charts that end at the current price. Tests must be deterministic.

## Decision

- **Seeded randomness only.** All randomness comes from a seeded generator (`mulberry32` plus Box-Muller for normals). The live simulator takes a seed from the environment; tests use fixed seeds.
- **Live prices (stateful).** Each stock has a price, previous close, day open, day high and low, volume and a volatility multiplier. A step moves each due stock by `beta * marketFactor + sigma * volMultiplier * z`. The market factor is shared by all stocks, so they correlate. The multiplier decays toward 1 and is pushed up by large shocks, which gives volatility clustering. Each stock draws its next tick time from an exponential distribution, so ticks are irregular. Prices are rounded to cents and never fall below one cent. The "day" rolls over at 00:00 UTC (previous close becomes the last price).
- **The market is always open.** There are no sessions or weekends, so the demo always has live data and every period has a full chart.
- **History (stateless).** Every candle is a pure function of the stock, the bucket index and the current price: a log-return per bucket comes from a hash of (symbol, bucket index), and a larger "overnight gap" return is added at each UTC day boundary. The path is built backward from the current price, so the last close equals the live price exactly and the series is deterministic between requests apart from the moving right edge. Volatility regimes come from a hash of (symbol, day), which clusters volatility within a day.
- **Universe.** Real tickers with approximate prices from a point-in-time snapshot, labeled as simulated everywhere. Prices are illustrative, not quotes.

## Alternatives considered

- **Real data provider.** Rejected by the plan: keys, rate limits, licensing and flaky demos.
- **Stateful history (store every generated candle).** Rejected: needs memory growth or persistence, and determinism is harder to prove than with pure functions.
- **Trading sessions and weekends.** Rejected: empty charts on weekends make the demo look broken, and DST/timezone handling adds risk without helping the evaluation.

## Consequences

- History levels drift with the live price (shape is stable, absolute level is relative to now). Acceptable for a simulation, and stated here so nobody expects stable historical closes.
- Pure functions make the domain logic fully testable at 100% coverage with fixed seeds and a fake clock.
- Real market features (halts, after-hours, splits) are out of scope.
