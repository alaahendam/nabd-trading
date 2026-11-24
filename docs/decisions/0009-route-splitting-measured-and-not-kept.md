# 0009. Route-level code splitting was measured and not kept

- Status: accepted
- Date: 2026-11-24

## Context

The Phase 6 plan carried one item over from Phase 5: the single main chunk (about 570 kB, 180 kB gzipped) makes Vite warn, and splitting the three pages with `lazy` routes was expected to shrink it.

## Decision

Keep one main chunk and the chart chunk. The pages are not split.

I made the three pages lazy routes and built it. The page chunks came out at 0.34 to 0.37 kB each. Everything the pages share (React, the router, TanStack Query, i18next, the socket client, zod and the stocks feature) moved into one 355 kB shared chunk next to a 227 kB entry. A first visit still downloads 582 kB, in two requests that depend on each other instead of one, and every first visit to a page adds a third. The change cost a request waterfall and bought nothing, so it was reverted.

What is already split is the part that is large and not needed at first paint: `lightweight-charts` (165 kB, 54 kB gzipped) loads on the stock page only, through the chart port.

## Alternatives considered

- **Manual vendor chunks.** They help long-term caching (a release that only changes app code keeps the React chunk cached), not the first load. Worth doing when releases are frequent; not now.
- **Lazy-loading the Arabic resources.** A few kilobytes for one language; not worth the extra state.
- **Raising the warning limit.** Hides the number instead of explaining it; the number is explained here.

## Consequences

- The production build keeps its chunk size warning. It is expected, and this note is its explanation.
- If the app grows pages that do not share the core (an admin area, say), splitting those routes becomes worthwhile and the router already supports it through `lazy`.
