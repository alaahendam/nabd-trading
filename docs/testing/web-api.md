# Test matrix: web API client, query client

Modules: `packages/api-client/src` (`client-id.ts`, `api-error.ts`, `http-client.ts`, `endpoints.ts`: shared by web and mobile since mobile M0), `apps/web/src/lib/api` (`browser-client-id.ts`, the `localStorage` and `crypto.randomUUID` way to keep the ID), and `packages/data/src` (`api-provider.tsx`, `query-client.ts`, `query-keys.ts`: the query layer shared by web and mobile since mobile M0). The package is the only code that may call `fetch` (lint-enforced). Tested against a mock server (MSW) that fails any request without a handler.

## Purpose and public surface

- `createClientIdProvider(storage)`: the anonymous client ID. A UUID stored in `localStorage` (`nabd.clientId`), regenerated if the stored value is not a UUID, and kept in memory for the session if storage is blocked, so every request carries the same ID.
- `ApiClientError`: every failure the client raises, with `kind` (`network`, `http`, `parse`), the HTTP `status` and the server's error `code` and `details` when it sent one, and `retryable`. Aborts are not wrapped: they stay `AbortError` so TanStack Query treats them as cancellations.
- `createHttpClient({ baseUrl, getClientId, fetch? })`: `request(schema, options)` returns the response parsed with a shared schema (network data is untrusted), `send(options)` is for responses without a body (`204`). Adds `x-client-id` and `Accept`, builds `baseUrl + /api + path + query`.
- `createApi(http)`: typed calls for the stocks and watchlist endpoints using the shared routes and response schemas, returning the unwrapped `data`.
- `ApiProvider` and `useApi()`: React access so features and tests choose the client.
- `createQueryClient()`: retries only network errors and 5xx, 408 and 429 (twice, with backoff), never 4xx or parse errors; stale after 30 s; mutations are not retried. `queryKeys`: the one place query keys are built.

## Cases: client ID

| ID     | Case                          | Input / setup                                      | Expected                                             | Level |
| ------ | ----------------------------- | -------------------------------------------------- | ---------------------------------------------------- | ----- |
| CID-01 | A stored UUID is reused       | storage holds a UUID                               | that UUID, nothing written                           | unit  |
| CID-02 | No stored value               | empty storage, a fixed UUID generator              | the generated UUID, written to `nabd.clientId`       | unit  |
| CID-03 | A stored non-UUID is replaced | storage holds `abc`                                | a new UUID, written                                  | unit  |
| CID-04 | Blocked storage               | `getItem` and `setItem` throw                      | a UUID is still returned                             | unit  |
| CID-05 | The ID is stable              | call the provider repeatedly, with blocked storage | the same value every time, the generator called once | unit  |
| CID-06 | The browser default           | `createBrowserClientIdProvider()` in jsdom         | persists a real UUID in `localStorage`               | unit  |

## Cases: errors

| ID     | Case                                   | Input / setup                                                         | Expected                                                                                   | Level |
| ------ | -------------------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | ----- |
| ERR-01 | Retryability by kind and status        | network; http 500, 502, 503, 408, 429; http 400, 401, 404, 422; parse | retryable for network and 5xx, 408, 429; not for the rest                                  | unit  |
| ERR-02 | The error carries what the server said | http error with code `NOT_FOUND`, message, details                    | `kind`, `status`, `code`, `message`, `details` are available; it is an `Error` with a name | unit  |
| ERR-03 | `isRetryable` accepts anything         | an `ApiClientError`; a plain `Error`; a string; `undefined`           | follows the error's flag; `false` for everything else                                      | unit  |
| ERR-04 | The cause is kept                      | a network failure wrapping a `TypeError`                              | `error.cause` is that `TypeError`                                                          | unit  |

## Cases: HTTP client (MSW)

| ID      | Case                                    | Input / setup                                     | Expected                                                                                     | Level |
| ------- | --------------------------------------- | ------------------------------------------------- | -------------------------------------------------------------------------------------------- | ----- |
| HTTP-01 | Request shape                           | `GET /stocks`                                     | URL `base/api/stocks`, header `x-client-id` is the provider's ID, `Accept: application/json` | unit  |
| HTTP-02 | Query parameters                        | `{ period: '1W', q: 'a b&c' }`                    | encoded in the URL                                                                           | unit  |
| HTTP-03 | A valid response is parsed and returned | handler returns valid JSON                        | the schema's output (defaults applied, unknown keys stripped)                                | unit  |
| HTTP-04 | A response that breaks the schema       | valid JSON, wrong shape                           | `ApiClientError` kind `parse`, not retryable, message names the problem                      | unit  |
| HTTP-05 | A body that is not JSON                 | `200` with `text/plain`                           | kind `parse`                                                                                 | unit  |
| HTTP-06 | The server's error shape                | `404` with the shared error body                  | kind `http`, status 404, code `NOT_FOUND`, the server's message and details                  | unit  |
| HTTP-07 | An error with no shared body            | `502` with an HTML body; `404` with an empty body | kind `http`, status kept, a generic message, `code` undefined; 502 retryable, 404 not        | unit  |
| HTTP-08 | The network is down                     | handler returns a network error                   | kind `network`, retryable, cause kept                                                        | unit  |
| HTTP-09 | An aborted request                      | abort the signal while the request is pending     | rejects with `AbortError`, not wrapped                                                       | unit  |
| HTTP-10 | A request without a body                | `send` for a `204`; for a `200`                   | resolves with nothing in both cases                                                          | unit  |
| HTTP-11 | `send` raises errors like `request`     | `send` for `404` and for a network error          | `ApiClientError` kind `http`; kind `network`                                                 | unit  |
| HTTP-12 | Base URLs with a trailing slash         | `http://api.test/` and `http://api.test`          | the same final URL                                                                           | unit  |
| HTTP-13 | The default `fetch`                     | no `fetch` option                                 | the global `fetch` is used                                                                   | unit  |

## Cases: endpoints (MSW)

| ID     | Case                                  | Input / setup                                                | Expected                                                    | Level |
| ------ | ------------------------------------- | ------------------------------------------------------------ | ----------------------------------------------------------- | ----- |
| EPT-01 | List stocks                           | `GET /api/stocks`                                            | an array of stocks with quotes (unwrapped from `data`)      | unit  |
| EPT-02 | One stock                             | `GET /api/stocks/AAPL`; `BRK.B`                              | the stock; a dotted symbol keeps its dot in the path        | unit  |
| EPT-03 | History                               | `GET /api/stocks/AAPL/history?period=1W`                     | the history data for that period                            | unit  |
| EPT-04 | Watchlist list, add and remove        | `GET /api/watchlist`, `PUT` and `DELETE /api/watchlist/AAPL` | the items; the added item; `undefined` after the `204`      | unit  |
| EPT-05 | Server errors surface with their code | `404` for a stock                                            | `ApiClientError` code `NOT_FOUND`, status 404               | unit  |
| EPT-06 | Contract violations are caught        | a stock response whose quote has `high` below `price`        | kind `parse` (the shared refinement runs on the client too) | unit  |
| EPT-07 | Calls can be aborted                  | pass an aborted signal                                       | rejects with `AbortError`                                   | unit  |

## Cases: query client and keys

| ID     | Case                               | Input / setup                                                        | Expected                                                                      | Level |
| ------ | ---------------------------------- | -------------------------------------------------------------------- | ----------------------------------------------------------------------------- | ----- |
| QRY-01 | Retry policy                       | `shouldRetry` with network, 503, 429 errors at failure counts 0 to 2 | retries at counts 0 and 1, stops at 2                                         | unit  |
| QRY-02 | No retries for permanent errors    | 404, 422, 401, parse error, a plain `Error`                          | never retried                                                                 | unit  |
| QRY-03 | Backoff                            | `retryDelay` for attempts 0 to 6                                     | grows (1 s, 2 s, 4 s, then capped at 8 s)                                     | unit  |
| QRY-04 | Defaults                           | `createQueryClient().getDefaultOptions()`                            | queries stale after 30 s, kept 5 min, refetch on focus; mutations not retried | unit  |
| QRY-05 | Clients are independent            | two clients                                                          | different instances with separate caches                                      | unit  |
| QRY-06 | A failing query in the real client | a query that fails with a 404 and one with a 503                     | the 404 fails after one attempt; the 503 is retried (fake timers)             | unit  |
| QRY-07 | Keys                               | `queryKeys`                                                          | stable, distinct, and hierarchical (history under its stock)                  | unit  |

## Cases: provider

| ID     | Case                                 | Input / setup             | Expected              | Level     |
| ------ | ------------------------------------ | ------------------------- | --------------------- | --------- |
| PRV-01 | `useApi` returns the provided client | render with `ApiProvider` | the same object       | component |
| PRV-02 | `useApi` needs the provider          | render without it         | a clear error message | component |

## Coverage target

100% statements, branches, functions and lines for every file in `packages/api-client`, `packages/data` and `lib/api` (thresholds in each package's Vitest config).

## Out of scope

The screens that use these (Phase 5), optimistic watchlist updates (Phase 5), a real network.

## Stock list paging (design polish)

| ID     | Behavior                                    | Input                                                                 | Expected                                                                                            | Level |
| ------ | ------------------------------------------- | --------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | ----- |
| EPT-08 | The list sends its query and returns a page | `listStocks({ limit: 10, cursor: 'MSFT', symbols: ['AAPL','NVDA'] })` | `limit`, `cursor` and `symbols=AAPL,NVDA` in the query string; `{ stocks, nextCursor, total }` back | unit  |
| EPT-09 | Nothing is sent for an empty query          | `listStocks({})`                                                      | no query string                                                                                     | unit  |

## Custom history range (design polish)

| ID     | Behavior                                  | Input                                             | Expected                                                                 | Level |
| ------ | ----------------------------------------- | ------------------------------------------------- | ------------------------------------------------------------------------ | ----- |
| EPT-10 | A custom range is sent as `from` and `to` | `getHistory('AAPL', { from: 1000, to: 9000000 })` | `from` and `to` in the query string and no `period`; the data comes back | unit  |
