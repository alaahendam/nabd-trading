# Test matrix: server common foundation and health

Modules: `apps/server/src/common/*` (`api-exception`, `error-response`, `all-exceptions.filter`, `zod-validation.pipe`), `src/app.setup.ts`, `src/modules/health`.

## Purpose and public surface

- `ApiException`: throw it from anywhere with a shared `ErrorCode`; it carries the status from `ERROR_STATUS` and the body from `createApiError`.
- `toErrorResponse`: turns any thrown value into `{ status, body }` in the shared error shape. Framework HTTP errors are mapped to a code with a generic message; anything unknown becomes `INTERNAL_ERROR` with a fixed message, so internals never reach a client.
- `AllExceptionsFilter`: catch-all filter that replies with that response and logs unexpected errors (with their stack, to the server log only).
- `ZodValidationPipe`: validates a param, query or body with a shared schema; on failure throws `VALIDATION_ERROR` with `details` listing `{ path, message }`.
- `configureApp`: global prefix `/api` and `helmet` security headers, used by `main.ts` and by the tests, so tests run the real HTTP setup.
- `GET /api/health`: `{ data: { status: 'ok', uptimeSeconds } }`, validated against the shared contract.

## Cases: unit

| ID     | Case                                               | Input / setup                                      | Expected                                                                                                                                       | Level |
| ------ | -------------------------------------------------- | -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ----- |
| COM-01 | `ApiException` carries code, status and body       | each code, with and without details                | `getStatus()` is `ERROR_STATUS[code]`; `getResponse()` equals `createApiError(...)`                                                            | unit  |
| COM-02 | `toErrorResponse` passes an `ApiException` through | an `ApiException`                                  | same status and body                                                                                                                           | unit  |
| COM-03 | Framework HTTP errors map to codes                 | 404, 409, 503, 400, 413, 418                       | `NOT_FOUND`/404, `CONFLICT`/409, `SERVICE_UNAVAILABLE`/503, `VALIDATION_ERROR`/422 (400 and 413), `INTERNAL_ERROR`/500 (418); generic messages | unit  |
| COM-04 | Unknown throwables become a generic 500            | `Error('secret db password')`, a string, `null`    | `INTERNAL_ERROR`/500, fixed message, original message absent from the body                                                                     | unit  |
| COM-05 | The filter logs unexpected errors only             | unknown error, `ApiException`, 404 `HttpException` | logged once with the stack for the unknown error; not logged for the others                                                                    | unit  |
| COM-06 | The pipe returns the parsed value                  | schema with a default and a coercion               | transformed output, defaults applied                                                                                                           | unit  |
| COM-07 | The pipe rejects with `VALIDATION_ERROR`           | invalid value                                      | `ApiException`, 422, `details` is `[{ path, message }]`                                                                                        | unit  |
| COM-08 | Pipe details use dotted paths                      | nested invalid field                               | `path` is `a.b`                                                                                                                                | unit  |

## Cases: HTTP (supertest, real app setup)

| ID     | Case                                      | Input / setup                            | Expected                                                          | Level |
| ------ | ----------------------------------------- | ---------------------------------------- | ----------------------------------------------------------------- | ----- |
| COM-09 | Health returns ok                         | `GET /api/health`                        | 200, body passes `healthResponseSchema`, uptime is not negative   | e2e   |
| COM-10 | Unknown route uses the error shape        | `GET /api/nope`                          | 404, body passes `apiErrorSchema`, code `NOT_FOUND`               | e2e   |
| COM-11 | Routes live under `/api` only             | `GET /health`                            | 404 `NOT_FOUND`                                                   | e2e   |
| COM-12 | Security headers are set                  | `GET /api/health`                        | `x-content-type-options: nosniff`; no `x-powered-by`              | e2e   |
| COM-13 | An unexpected throw never leaks           | test controller throws `Error('secret')` | 500, `INTERNAL_ERROR`, response text has no `secret` and no stack | e2e   |
| COM-14 | A thrown `ApiException` is answered as is | test controller throws `CONFLICT`        | 409 and the shared error body                                     | e2e   |
| COM-15 | The pipe works on a real request          | test route with a validated query        | valid query 200; invalid query 422 with `details`                 | e2e   |

## Coverage target

100% statements, branches, functions and lines for `src/common`. `src/modules/health` is covered by COM-09 and COM-12.

## Out of scope

Chaos flags (Task 9), identity guard (Task 7), CORS and the Socket.IO adapter (`main.ts`, Task 10).
