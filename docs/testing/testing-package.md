# `@nabd/testing`: test matrix

Scope: the framework-agnostic helpers shared by the web and the mobile app: recorders, the fake API, the fake socket, fixtures and the mock API handlers (`@nabd/testing/msw`). The package has no test framework inside (no `vi`, no `jest`), so these tests also prove that. Coverage target: 100%.

## Recorder (`recorder.ts`)

| ID     | Behavior                                   | Input                                                             | Expected                                                        | Level |
| ------ | ------------------------------------------ | ----------------------------------------------------------------- | --------------------------------------------------------------- | ----- |
| REC-01 | Records every call                         | call with `(1, 'a')` then `(2, 'b')`                              | `calls` is `[[1,'a'],[2,'b']]`                                  | unit  |
| REC-02 | The fallback runs until a test chooses     | a recorder created with a fallback, called with no choice made    | the fallback's result                                           | unit  |
| REC-03 | `implement` replaces the behavior          | `implement(fn)`, then call twice                                  | `fn` answers both calls                                         | unit  |
| REC-04 | `implementOnce` answers one call           | `implementOnce(fn)`, then call twice                              | the first call gets `fn`, the second the fallback               | unit  |
| REC-05 | `returns` gives a fixed value              | `returns(42)`                                                     | every call returns 42                                           | unit  |
| REC-06 | `resolves` and `resolvesOnce`              | `resolves('x')`; `resolvesOnce('y')` first                        | promises resolving to the value; the once value comes first     | unit  |
| REC-07 | `rejects` and `rejectsOnce`                | `rejects(e)`; `rejectsOnce(e2)` first                             | promises rejecting with the error; the once error comes first   | unit  |
| REC-08 | Once answers queue in order                | three `*Once` choices                                             | calls get them in the order they were queued, then the default  | unit  |
| REC-09 | A once answer wins over the chosen default | `resolves('d')` then `resolvesOnce('o')`                          | first call `'o'`, then `'d'`                                    | unit  |
| REC-10 | `reset` forgets everything                 | calls, choices and queued answers, then `reset()`                 | `calls` empty, the fallback applies, queued answers are gone    | unit  |
| REC-11 | The arguments are kept as they were        | call with an object, then mutate a copy of the call list          | the recorded object is the one passed in                        | unit  |
| REC-12 | The choosing methods chain                 | `rejectsOnce(e).resolves(v)`; each choosing method's return value | each returns the recorder itself, and the chained choices apply | unit  |

## Fake API (`fake-api.ts`)

| ID     | Behavior                    | Input                                 | Expected                                                        | Level |
| ------ | --------------------------- | ------------------------------------- | --------------------------------------------------------------- | ----- |
| FAK-01 | An unstubbed method rejects | each of the six methods, called as is | rejects with "<name> was not stubbed", and the call is recorded | unit  |
| FAK-02 | A stubbed method answers    | `getStock.resolves(aapl)`             | the call resolves to `aapl`; other methods still reject         | unit  |

## Fake socket (`fake-socket.ts`)

| ID     | Behavior                              | Input                                                           | Expected                                                   | Level |
| ------ | ------------------------------------- | --------------------------------------------------------------- | ---------------------------------------------------------- | ----- |
| SOK-01 | Records what the client asks for      | `connect`, `subscribe`, `unsubscribe`, `disconnect`             | `calls` counts and symbol lists, copies not references     | unit  |
| SOK-02 | The connected flag follows the server | `simulateConnect`, then `disconnect()` and `simulateDisconnect` | `connected` is true, then false in both cases              | unit  |
| SOK-03 | Plays the server to every handler     | one handler per event, then each `simulate*`                    | each handler gets its payload (disconnect gets the reason) | unit  |
| SOK-04 | Several handlers all hear the event   | two handlers on the same event                                  | both are called                                            | unit  |

## Fixtures (`fixtures.ts`)

| ID     | Behavior                            | Input                                     | Expected                                                                   | Level |
| ------ | ----------------------------------- | ----------------------------------------- | -------------------------------------------------------------------------- | ----- |
| FIX-01 | Fixtures are valid contract data    | every fixture through its Zod schema      | all parse                                                                  | unit  |
| FIX-02 | `stocksPage` builds a page          | stocks only; with a cursor and a total    | defaults: `nextCursor` null, `total` the length; the given values are kept | unit  |
| FIX-03 | The fake stock server pages         | `limit` 2 over five stocks, then `cursor` | first page of 2 with the cursor of its last symbol; the next from there    | unit  |
| FIX-04 | The last page has no cursor         | the page that reaches the end             | `nextCursor` null                                                          | unit  |
| FIX-05 | No limit returns everything         | no `limit`                                | all stocks, no cursor, `total` the length                                  | unit  |
| FIX-06 | `symbols` filters and does not page | `symbols` of two stocks                   | those stocks in list order, no cursor, `total` their count                 | unit  |

## Mock API handlers (`msw.ts`)

| ID     | Behavior                            | Input                                                  | Expected                                                 | Level |
| ------ | ----------------------------------- | ------------------------------------------------------ | -------------------------------------------------------- | ----- |
| MSW-01 | The watchlist handler               | empty; with items                                      | `{ data: [] }`; `{ data: items }`                        | unit  |
| MSW-02 | Stock, history and list handlers    | the three requests                                     | `aapl`; `aaplHistory`; the two-stock page with no cursor | unit  |
| MSW-03 | An unhandled request fails the test | a request with no handler, `onUnhandledFrame: 'error'` | the request fails                                        | unit  |

## Out of scope

The fake chart and the browser-only fakes (`IntersectionObserver`) stay in the web app: they fake web-only ports. Test providers (`feature-harness`) stay in each app.
