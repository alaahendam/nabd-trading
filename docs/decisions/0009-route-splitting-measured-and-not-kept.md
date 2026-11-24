# 0009. Route splitting was measured and not kept; vendor chunks instead

- Status: accepted
- Date: 2026-11-24

## Context

The Phase 5 build had one main chunk of 585.5 kB (180.1 kB gzipped), which makes Vite warn (limit 500 kB). The Phase 6 plan expected route-level splitting to shrink it.

## Decision

**Pages are not split by route.** I made the three pages lazy routes and built it. The page chunks came out at 0.34 to 0.37 kB each: everything the pages share (React, the router, TanStack Query, i18next, the socket client, zod and the stocks feature) moved into one 355 kB shared chunk beside a 227 kB entry. A first visit still downloaded 582 kB, now in two dependent requests instead of one, and each first visit to a page added a third. It cost a request waterfall and gave nothing, so it was reverted.

**Stable dependencies get their own chunks.** `build.rolldownOptions.output.codeSplitting.groups` (Vite 8 uses Rolldown, where `manualChunks` is deprecated in favor of this option) puts the dependencies that rarely change in three files. The point is long-term caching: a release that only changes app code re-downloads the 51 kB entry, and the browser keeps the other 533 kB.

| Chunk                       |          Raw |         Gzip | Holds                                                 |
| --------------------------- | -----------: | -----------: | ----------------------------------------------------- |
| `react`                     |     313.9 kB |      98.8 kB | react, react-dom, scheduler, react-router             |
| `data`                      |     163.8 kB |      47.3 kB | TanStack Query, Socket.IO client and parser, zod      |
| `i18n`                      |      55.6 kB |      18.1 kB | i18next, react-i18next                                |
| `index` (the app)           |      51.5 kB |      16.9 kB | the app's own code and the shared contracts           |
| runtime                     |       0.7 kB |       0.4 kB |                                                       |
| **First load**              | **585.2 kB** | **181.6 kB** | five files, fetched in parallel                       |
| `lightweight-chart-adapter` |     165.5 kB |      53.6 kB | loaded on the stock page only, through the chart port |

The total is the same as before (585.5 kB raw, 180.1 kB gzip), because the dependencies are what they are. What changed is that no file is over the limit, so the warning is gone without raising the limit, and that the app's own code, the part that changes on each release, is 51 kB instead of 585 kB.

## Alternatives considered

- **Raising `chunkSizeWarningLimit`.** Not needed once the chunks are split; it would only hide a number.
- **Lazy-loading the Arabic resources.** A few kilobytes for one language; not worth the extra state.
- **A lazy socket client.** The list is live on first paint, so it is needed at once.

## Consequences

- The build is warning-free. If a chunk grows past 500 kB the warning returns, which is the signal to look again.
- Dependencies not listed in a group (clsx, class-variance-authority, and so on) stay in the app chunk; they are small. A new large dependency should be added to a group or lazy-loaded.
- If the app grows pages that do not share the core (an admin area, say), splitting those routes becomes worthwhile; the router already supports it through `lazy`.
