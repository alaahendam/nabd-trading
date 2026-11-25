# Mobile M3: features

Part of `docs/MOBILE-PLAN.md` (section 5). Goal: the three features of the web app, on the mobile foundation of M2: the stock list (paged, live), the watchlist (optimistic star, rollback), and the stock detail with the chart and its text summary. The data hooks already exist in `@nabd/data` and `@nabd/market-data`; this phase is the native UI on top of them, so the work is rows, states, lists, the star and the chart.

## Decisions for this phase

- **Lists: FlashList v2** (`@shopify/flash-list`), as locked in the plan. Rows are small components keyed by symbol that read only their own price (`useLivePrice(symbol)`), so a tick re-renders one row. A recycled row is the same component given another stock, so the row must show nothing of the stock it showed before: that is tested directly (`ROW-04`).
- **Paging: `onEndReached`** loads the next page, as the visible "Load more" button does on the web. A failed page shows the message and a retry button, and does not retry by itself, so a failing request is not repeated in a loop. Pull to refresh reloads.
- **Subscriptions grow with the scrolling:** only loaded rows are subscribed, as on the web.
- **`useLiveQuote` is written again in the mobile app** (a 25-line hook) because it lives in `apps/web` today. It is a candidate to move into a shared package with its web test; that is a separate change, so the web's tests stay untouched in this phase.
- **Color is never the only signal:** price changes show a sign and are announced as up, down or unchanged; a price that is not fresh says "Delayed".
- **Chart:** the three-candidate spike comes first and ends in an ADR, then the chart behind a small port, with the native text summary of `summarizeHistory` in every case. Periods are the five of the web (1D, 1W, 1M, 3M, 1Y). The web's custom date range is not part of the mobile app in this phase; it is listed in the README's limits.
- **Touch targets** are at least 48 (the star, the period buttons, the retry buttons).

## Tasks

- [x] **T1 Test matrix.** `docs/testing/mobile-features.md`, before the code.
- [x] **T2 Rows.** `useLiveQuote`, price and change text, the stock row.
- [x] **T3 Stock list.** FlashList, loading, empty, error, paging, refresh, subscriptions, the Stocks tab.
- [ ] **T4 Watchlist.** The star with optimistic update and rollback, the Watchlist tab with its states.
- [ ] **T5 Stock detail.** Header, stats, states (loading, not found, error), the star, live price.
- [ ] **T6 Chart spike and ADR.** Three candidates on the same data, measured, decided.
- [ ] **T7 Chart.** The chosen chart behind a port, the period switcher, its states, the text summary.
- [ ] **T8 Gates.** Whole-repo gates, CI green on the PR, plan ticked, README limits.

## Gate

Lint, typecheck, test and build green for the repository and the mobile app; every state of every feature tested; a recycling test; CI green on the PR; checked on the author's phone against the live server.
