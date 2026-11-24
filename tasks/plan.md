# Implementation Plan: Phase 5, features

Source: `docs/PLAN.md` section 6, Phase 5 (stock list, stock detail with chart, watchlist). Working agreement: `CLAUDE.md`. The Phase 4 plan is fully checked off and kept in git history. Everything here stands on the Phase 4 foundation: realtime hooks, API client, query client, shell, design tokens, i18n.

## Overview

Three vertical slices, each usable on its own: a live stock list, a stock detail page with a candlestick chart and period switcher, and a server-side watchlist with optimistic updates. Every state is designed and tested (loading skeleton, empty, error with retry, reconnecting, stale price, Arabic/RTL). E2E across the whole flow is Phase 6; Phase 5 proves each feature with component tests (MSW, fake socket) and a real-browser check.

## Architecture decisions

- **Two features, one direction.** `features/stocks` (list, detail, chart, queries) knows nothing about the watchlist. `features/watchlist` imports `stocks` through its public `index.ts` (it renders stock rows) and exports the star toggle. The route layer in `app/` composes the star into the list and the detail page through a slot (`renderAction`). This avoids a `stocks` ↔ `watchlist` import cycle and keeps the boundary lint meaningful.
- **Live price on top of REST.** REST gives the quote (previous close, open, high, low, volume); the live store gives the latest price. Change and percent are derived from the live price and the REST previous close with the Phase 4 formatters, so a row never shows a price that disagrees with its change.
- **Subscriptions follow the screen.** A list subscribes to the symbols it shows with `useSubscription`; the detail page subscribes to one. Reference counting makes navigating between them free.
- **Chart behind a port.** `lightweight-charts` 5.3 (Apache-2.0) needs a canvas, which jsdom lacks, so the component talks to a small `ChartPort` and the real adapter is the only file importing the library (lint-enforced, like `socket.io-client`). Tests drive a fake port; the real chart is verified in the browser. The chart is loaded lazily, which also removes the large-chunk warning from the initial bundle.
- **Chart facts verified in the installed types:** `time` is `UTCTimestamp` in **seconds** (our history uses milliseconds, so it is divided by 1000), `autoSize: true` handles resizing, `series.update()` is the way to apply live ticks, `chart.remove()` disposes.
- **Attribution.** The license requires the NOTICE text and a link to tradingview.com on a page users can see. The footer carries both, in i18n, and the chart's `attributionLogo` is on.
- **Watchlist writes are optimistic.** Add and remove update the cache at once, roll back on error, and revalidate on settle. Mutations are not retried (Phase 4 policy), because a silent retry could hide a failure.
- **Period switcher is a toggle-button group** (`aria-pressed`), the same pattern as the theme switcher, not ARIA tabs, since it does not control separate panels.

## Dependency graph

```
shared atoms (Skeleton, ChangeBadge, StateMessage)
  └─ stocks data hooks (useStocks, useStock, useHistory)
       ├─ stock list (rows, live price, states)
       └─ stock detail (header, stats, chart port, period switcher)
            └─ routes + attribution
  └─ watchlist data hooks (query + optimistic mutations)
       └─ star toggle + watchlist view
            └─ composition in app, verification
```

## Task list

### Slice 1: stock list

- [x] Task 1: shared atoms: `Skeleton`, `ChangeBadge` (arrow, sign and color, never color alone), `StateMessage` (empty and error with retry)
- [x] Task 2: `features/stocks` data hooks over the API client and query keys
- [x] Task 3: stock list: rows with live price and flash, change vs previous close, freshness, loading, empty, error, reconnecting
- [x] Checkpoint: list works against the real server

### Slice 2: stock detail and chart

- [x] Task 4: detail header and stats (price, change, open, high, low, volume, previous close)
- [x] Task 5: chart: `ChartPort`, real adapter, period switcher, history query, live last-candle update, theme colors, loading and error
- [x] Task 6: page titles and the attribution footer (the chart library is code-split by its loader, so the route itself is not lazy)
- [x] Checkpoint: detail works against the real server

### Slice 3: watchlist

- [x] Task 7: watchlist data hooks with optimistic add and remove, rollback
- [x] Task 8: `WatchlistToggle` (real button, `aria-pressed`), watchlist view, composition into list and detail
- [x] Task 9: real-browser verification (RTL, dark, live ticks, offline, mobile), whole-repo gates, ADR, README and plan updates

## Acceptance criteria (phase level)

- Each feature has a test matrix in `docs/testing/` written before its code, and every ID is covered by a test.
- Logic files at 100% per-file coverage; global floor holds. No lowered thresholds, no lint or type escapes.
- All user text in both languages, no literal strings in JSX; digits always Latin.
- Up and down shown by color and sign or arrow. AA contrast in both themes (new color pairings are added to the token contrast test).
- Real browser: live ticks flow, Arabic RTL and dark theme look right, no console errors, reload keeps the watchlist.

## Risks and mitigations

| Risk                                                     | Impact | Mitigation                                                                              |
| -------------------------------------------------------- | ------ | --------------------------------------------------------------------------------------- |
| Re-rendering every row on every tick                     | High   | Per-symbol selectors from Phase 4; a test asserts an unrelated row does not re-render   |
| Chart colors drifting from tokens                        | Medium | Colors read from the CSS custom properties at render time and refreshed on theme change |
| Optimistic update leaves the cache wrong after a failure | High   | Snapshot and rollback in `onError`, invalidate in `onSettled`, tested with MSW failures |
| Canvas library hard to test                              | Medium | `ChartPort` seam, fake in tests, real adapter checked in the browser                    |
| Initial bundle growth from the chart                     | Medium | Lazy-load the detail route; the production build warning is the check                   |

## Open questions

- None blocking. Search or sort on the list is out of scope for Phase 5 and can be added later if wanted.
