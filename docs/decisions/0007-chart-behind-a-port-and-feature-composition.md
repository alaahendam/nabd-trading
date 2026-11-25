# 0007. The chart behind a port, and how the features fit together

- Status: accepted
- Date: 2026-11-24

## Context

Phase 5 adds three features: a stock list, a stock detail page with a candlestick chart, and a watchlist. Three questions had real consequences:

1. The chart library (TradingView Lightweight Charts, Apache-2.0) draws on a canvas, which the test environment does not have, and it is large.
2. The star that adds a stock to the watchlist appears in the stock list and on the detail page, while the watchlist page shows stocks. A direct import in both directions would make `stocks` and `watchlist` depend on each other.
3. The license asks for the library's notice and a link to tradingview.com on a page users can see.

## Decision

- **The chart sits behind a small port.** The app talks to `ChartPort` (`setData`, `updateCandle`, `applyColors`, `applyLocale`, `dispose`). The only file that imports `lightweight-charts` is `lightweight-chart-adapter.ts`, and a lint rule enforces that, the same way it does for `socket.io-client`. The adapter is loaded on demand through a `ChartLoader`, which puts the library in its own chunk (about 165 kB) so the stock list does not pay for it, and a context supplies the loader so tests inject a fake. The candle math (`candles.ts`) is pure and converts milliseconds to the library's seconds in one place.
- **Live candles share the server's grid.** Buckets are aligned to the epoch on the server (`time = index * bucketMs`), and the client uses the same arithmetic, so a live tick either moves the last candle's close and range or starts a new candle at the right bucket start.
- **The canvas cannot read CSS variables.** The semantic token values are read at creation and again when the theme changes, so the chart follows light and dark without a second set of colors.
- **One direction between features.** `stocks` knows nothing about the watchlist. Its list and detail take an action slot (`renderAction`). `watchlist` imports `stocks` through its public `index.ts` (it renders stock rows with a symbol filter) and exports the star. The pages in `app/` put the star into the slot. There is no import cycle, and the boundary lint stays meaningful.
- **Day high and low live in the price store.** The store tracks the highest and lowest price it has published per symbol, so a range that widens with ticks never narrows again, and the list and detail agree.
- **The watchlist is optimistic.** The cache changes at once, a failed call restores the previous list, and the list is fetched again either way. Writes are not retried. A running list fetch is cancelled when a toggle starts, or it could overwrite the optimistic state with an old list.
- **Attribution.** The chart's own logo is on, and the footer carries the NOTICE text as a link to tradingview.com, kept in English and left to right in the Arabic layout. This is a reading of the project's own wording, not legal advice.

## Alternatives considered

- **Use the library directly in the component.** Rejected: it cannot run in jsdom, so the component would need heavy mocking of a canvas, and the library would sit in the main bundle.
- **Let `stocks` import the star from `watchlist`.** Rejected: with `watchlist` also needing stock rows, the two features would depend on each other.
- **A lazy route for the stock detail page.** Rejected as unnecessary: the large part, the chart library, is already split by the loader.
- **Track the day range in each component.** Rejected: it is lost when a component unmounts, so the list and the detail page would disagree.

## Consequences

- The chart, its colors and its live updates are tested without a canvas; the adapter is tested with the library mocked, and the real drawing is checked in a browser.
- A second chart library could replace this one by writing one adapter.
- Ticks coalesced into one frame count as one price, so an extreme reached and left inside a single frame is not recorded in the day range. That is accepted.
- The chart chunk is the only on-demand split. Splitting the pages by route was measured in Phase 6 and gave nothing, and the stable dependencies got their own chunks instead (ADR 0009).

## Amendments

- **Phase 6 and the design round.** The port gained `applyLocale`, so the time axis follows the app language (Latin digits, Arabic month and day names); the language changes the chart without rebuilding it. The chart container is a labelled `figure` and not an image, because the library's own attribution link sits inside it and interactive content cannot be nested in an image. Its description (`aria-describedby`) gives the period, start and end price, change, high and low, read from the loaded history and not from live ticks.
