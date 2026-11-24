# Test matrix: shared API contracts (identity, watchlist, errors, routes)

Modules: `packages/shared/src/watchlist.ts`, `errors.ts`, `routes.ts`.

## Purpose and public surface

- Identity: `CLIENT_ID_HEADER`, `clientIdSchema`. Auth is out of scope; an anonymous UUID in a header identifies a client, and the same header contract lets a JWT guard replace it later.
- Watchlist: `watchlistItemSchema`, and the list and item response shapes. The watchlist API is idempotent by design: `PUT /watchlist/:symbol` adds (succeeds if already present) and `DELETE /watchlist/:symbol` removes (succeeds if absent). Retries and optimistic-update rollbacks are therefore safe, and no idempotency key is needed. There is no add-body schema because the symbol is in the path.
- Errors: `ERROR_CODES`, `errorCodeSchema`, `ERROR_STATUS`, `apiErrorSchema`, `createApiError`. One error shape for every failure: `{ error: { code, message, details? } }`.
- Routes: `API_PREFIX`, `ROUTES` (pattern constants for the server) and `symbolRoute` (builds a concrete, encoded path for the client).

## Cases: identity and watchlist

| ID     | Case                                   | Input / setup                                 | Expected                                     | Level |
| ------ | -------------------------------------- | --------------------------------------------- | -------------------------------------------- | ----- |
| API-01 | Client ID accepts a UUID               | a v4 UUID                                     | parses                                       | unit  |
| API-02 | Client ID rejects non-UUIDs            | `''`, `abc`, a UUID with a trailing character | rejected                                     | unit  |
| API-03 | Header name is lowercase               | `CLIENT_ID_HEADER`                            | `x-client-id` (Node lowercases header names) | unit  |
| API-04 | Valid watchlist item                   | symbol and `addedAt`                          | parses                                       | unit  |
| API-05 | Invalid watchlist item                 | bad symbol, negative or fractional `addedAt`  | rejected on that field                       | unit  |
| API-06 | Watchlist responses wrap their payload | list and single item                          | accept `{ data }`, reject the bare payload   | unit  |

## Cases: errors

| ID     | Case                                          | Input / setup                                                         | Expected                                                                                    | Level |
| ------ | --------------------------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | ----- |
| ERR-01 | Error codes are the agreed closed set         | `ERROR_CODES`                                                         | `VALIDATION_ERROR NOT_FOUND CLIENT_ID_REQUIRED CONFLICT SERVICE_UNAVAILABLE INTERNAL_ERROR` | unit  |
| ERR-02 | Code schema accepts each code, rejects others | each code, `OOPS`, `''`                                               | accepted / rejected                                                                         | unit  |
| ERR-03 | Every code has an HTTP status                 | `ERROR_STATUS`                                                        | one entry per code, each an integer 400 to 599                                              | unit  |
| ERR-04 | Statuses follow the agreed mapping            | `ERROR_STATUS`                                                        | 422, 404, 401, 409, 503, 500 respectively                                                   | unit  |
| ERR-05 | Error body with and without details           | both shapes                                                           | parse                                                                                       | unit  |
| ERR-06 | Invalid error bodies                          | unknown code, empty message, no `error` key, bare `{ code, message }` | rejected                                                                                    | unit  |
| ERR-07 | `createApiError` builds a valid body          | code and message                                                      | equals `{ error: { code, message } }` with no `details` key, and passes `apiErrorSchema`    | unit  |
| ERR-08 | `createApiError` keeps details when given     | code, message, details object                                         | `error.details` is that object, and the body passes `apiErrorSchema`                        | unit  |

## Cases: routes

| ID     | Case                             | Input / setup               | Expected                                                     | Level |
| ------ | -------------------------------- | --------------------------- | ------------------------------------------------------------ | ----- |
| RTE-01 | Prefix and patterns              | `API_PREFIX`, `ROUTES`      | prefix is `/api`; every pattern starts with `/`              | unit  |
| RTE-02 | Symbol routes fill the parameter | each symbol pattern, `AAPL` | `/stocks/AAPL`, `/stocks/AAPL/history`, `/watchlist/AAPL`    | unit  |
| RTE-03 | A dotted symbol stays readable   | `BRK.B`                     | `.` is kept                                                  | unit  |
| RTE-04 | Unsafe characters are encoded    | `A/B`, `A B`, `A?B`         | `A%2FB`, `A%20B`, `A%3FB`; no raw `/`, space or `?` survives | unit  |

## Coverage target

100% statements, branches, functions and lines (enforced in `vitest.config.ts`).

## Out of scope

Server enforcement of these contracts (guards, filters, validation pipes) is Phase 3. Socket contracts have their own matrix (`shared-socket.md`).
