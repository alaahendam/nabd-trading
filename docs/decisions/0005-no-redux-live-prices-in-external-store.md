# 0005. No Redux: server state in TanStack Query, live prices in an external store

- Status: accepted
- Date: 2026-11-24

## Context

The web app has three kinds of state: remote data fetched over REST (stocks, history, watchlist), live prices pushed over a socket at several updates per second per symbol, and small client preferences (theme, language). `docs/PLAN.md` asks for Redux to be left out unless something needs it.

## Decision

- **REST data** lives in TanStack Query: caching, retries, request deduplication, and optimistic updates with rollback for the watchlist.
- **Live prices** live in an external store (`PriceStore`) read with `useSyncExternalStore` through per-symbol selectors. They do not go through TanStack Query. The store coalesces ticks per symbol and publishes them once per animation frame, so a burst of ticks causes at most one render per symbol per frame, and only components of the changed symbol re-render.
- **Preferences** (theme, language, connection status) are small external stores read the same way, or React context where it fits.
- There is **one socket** for the whole app, with reference-counted subscriptions: a symbol is subscribed while at least one component needs it.

## Alternatives considered

- **Redux or Zustand for everything.** Rejected: server data would be reimplemented badly (cache, retries, invalidation), and a general store makes per-symbol, per-frame updates easy to get wrong (every dispatch notifies every subscriber unless selectors are carefully memoized).
- **Live prices inside the Query cache.** Rejected: a cache write per tick would notify and re-render far more than needed and mixes request/response caching with streaming.

## Consequences

- Two small, well-tested pieces of infrastructure instead of a global store: `PriceStore` and the realtime client (100% covered).
- Components that need a live price call `useLivePrice(symbol)` and never touch the socket; a REST snapshot provides the initial value and the live price overrides it.
- If a future feature needs complex shared client state, adding a store for that state is a separate decision.
