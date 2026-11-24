# Test matrix: identity and watchlist

Modules: `src/modules/identity` (guard, `@CurrentUser()`), `src/modules/watchlist` (repository, service, controller). Decisions: ADR 0003.

## Purpose and public surface

- `IdentityGuard`: reads the `x-client-id` header, requires a UUID, and puts `{ id }` on the request. Anything else is `401 CLIENT_ID_REQUIRED`. Anonymous by design; a JWT guard can replace it without touching controllers because they only use `@CurrentUser()`.
- `@CurrentUser()`: the parameter decorator controllers use to get the identified user.
- `WatchlistRepository` (abstract): `list`, `get`, `save`, `delete` per client. `InMemoryWatchlistRepository` keeps insertion order, returns copies, and is bounded: at `maxClients` the least recently used client is evicted, so anyone sending random client IDs cannot grow memory without limit.
- `WatchlistService`: `list`, `add` (idempotent: an existing item keeps its first `addedAt`; an unknown symbol is `404`), `remove` (idempotent).
- Controller: `GET /api/watchlist`, `PUT /api/watchlist/:symbol` (200 with the item), `DELETE /api/watchlist/:symbol` (204). All behind the guard.

## Cases: identity

| ID     | Case                                | Input / setup                                               | Expected                                                  | Level |
| ------ | ----------------------------------- | ----------------------------------------------------------- | --------------------------------------------------------- | ----- |
| IDN-01 | A valid UUID identifies the client  | header with a UUID                                          | guard returns `true` and sets `request.user = { id }`     | unit  |
| IDN-02 | Missing or invalid IDs are rejected | no header, `''`, `abc`, a UUID plus junk, a repeated header | `ApiException` `CLIENT_ID_REQUIRED` (401); no user set    | unit  |
| IDN-03 | `@CurrentUser()` returns the user   | request with a user; request without one                    | the user; `CLIENT_ID_REQUIRED` when the guard did not run | unit  |

## Cases: repository

| ID     | Case                                          | Input / setup                                           | Expected                                                                  | Level |
| ------ | --------------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------- | ----- |
| REP-01 | A new client has an empty list                | `list` for an unseen client                             | `[]`                                                                      | unit  |
| REP-02 | Saved items are listed in insertion order     | save three items                                        | list order equals save order; `get` finds each                            | unit  |
| REP-03 | Delete removes and is idempotent              | delete a saved item twice; delete from an unseen client | gone after the first; no error after that                                 | unit  |
| REP-04 | Clients are isolated                          | two clients save different items                        | each list has only its own                                                | unit  |
| REP-05 | Results are copies                            | mutate a listed item and a fetched item                 | stored data unchanged                                                     | unit  |
| REP-06 | The oldest-used client is evicted at capacity | `maxClients: 2`, three clients; and a touched client    | the least recently used client is dropped; a client used recently is kept | unit  |
| REP-07 | Capacity must be at least one                 | `maxClients` `0`, `-1`, `1.5`                           | `RangeError`                                                              | unit  |

## Cases: service

| ID     | Case                                     | Input / setup                                         | Expected                                                     | Level |
| ------ | ---------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------ | ----- |
| WLS-01 | Add creates an item stamped by the clock | add `AAPL` at a fixed time                            | `{ symbol: 'AAPL', addedAt: <clock now> }`, and it is listed | unit  |
| WLS-02 | Add is idempotent                        | add twice with the clock moved                        | same item, first `addedAt` kept, one entry in the list       | unit  |
| WLS-03 | Add rejects an unknown symbol            | add `NOPE`                                            | `ApiException` `NOT_FOUND`; nothing saved                    | unit  |
| WLS-04 | Remove deletes                           | add then remove                                       | not listed                                                   | unit  |
| WLS-05 | Remove is idempotent                     | remove something never added (even an unknown symbol) | no error, list unchanged                                     | unit  |
| WLS-06 | List is in added order                   | add `MSFT` then `AAPL`                                | `MSFT`, `AAPL`                                               | unit  |
| WLS-07 | Clients are isolated                     | two clients add different symbols                     | each sees only its own                                       | unit  |

## Cases: HTTP

| ID     | Case                              | Input / setup                                        | Expected                                                    | Level |
| ------ | --------------------------------- | ---------------------------------------------------- | ----------------------------------------------------------- | ----- |
| WLH-01 | The guard protects every route    | `GET`, `PUT`, `DELETE` with no header                | 401, code `CLIENT_ID_REQUIRED`, shared error shape          | e2e   |
| WLH-02 | A malformed client ID is rejected | `x-client-id: abc`                                   | 401 `CLIENT_ID_REQUIRED`                                    | e2e   |
| WLH-03 | PUT adds                          | `PUT /api/watchlist/AAPL`                            | 200, passes `watchlistItemResponseSchema`                   | e2e   |
| WLH-04 | PUT is idempotent                 | `PUT` twice                                          | both 200 with the same `addedAt`                            | e2e   |
| WLH-05 | GET lists in added order          | `PUT` `MSFT` then `AAPL`, then `GET`                 | 200, passes `watchlistResponseSchema`, order `MSFT`, `AAPL` | e2e   |
| WLH-06 | DELETE removes and is idempotent  | `DELETE` twice                                       | 204 with an empty body both times; gone from `GET`          | e2e   |
| WLH-07 | Bad symbols                       | `PUT /api/watchlist/NOPE`; `PUT /api/watchlist/aapl` | 404 `NOT_FOUND`; 422 `VALIDATION_ERROR`                     | e2e   |
| WLH-08 | Clients are isolated              | client A adds `AAPL`; client B lists                 | B's list is empty                                           | e2e   |

## Coverage target

100% for `watchlist.service.ts`, `in-memory-watchlist.repository.ts`, `identity.guard.ts` and `current-user.ts` (per-file thresholds). The controller is covered by the HTTP cases.

## Out of scope

Persistence beyond memory (ADR 0003), rate limiting, real authentication.
