# 0003. Keep the watchlist in memory behind a repository interface

- Status: accepted
- Date: 2026-11-24

## Context

The plan says the watchlist is stored on the server per anonymous client ID. This is a take-home with no database, and adding one (plus migrations, a container and a test database) would dwarf the feature. Auth is out of scope, so there is no account to attach data to.

## Decision

`WatchlistService` depends on a `WatchlistRepository` interface (list, add, remove per client ID). The only implementation is in memory (`Map<clientId, Map<symbol, addedAt>>`). The REST contract (idempotent `PUT` and `DELETE` on `/watchlist/:symbol`) does not depend on the storage.

## Alternatives considered

- **SQLite or Postgres now.** Rejected: infrastructure and migrations out of proportion to the task, and tests would need a database.
- **Store it in the browser only.** Rejected: the plan requires server-side storage and optimistic updates with rollback against a real API.

## Consequences

- Watchlists are lost when the server restarts, and the server cannot scale past one instance. The README must say so.
- Swapping in a database later means writing one class that implements the interface; controller, service and tests do not change.
- The in-memory store grows with the number of client IDs. For a demo this is acceptable; a real service needs a bound or a TTL.
