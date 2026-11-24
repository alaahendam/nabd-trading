# Test matrix: CORS and application wiring

Modules: `src/app.setup.ts` (`configureApp`), `src/common/cors-io.adapter.ts` (`CorsIoAdapter`).

## Purpose and public surface

`configureApp(app)` is the one place HTTP setup lives, used by `main.ts` and by every end-to-end test, so tests run the real wiring. It sets helmet, the non-API 404 guard, the `/api` prefix, and CORS from `CORS_ORIGIN`:

- HTTP CORS allows exactly one configured origin (never `*`), the methods the API uses (including `PUT` and `DELETE`) and the custom `x-client-id` header, and answers preflight requests.
- The Socket.IO handshake gets the same single-origin policy through `CorsIoAdapter`, because Nest gateways do not read `enableCors`.

`main.ts` additionally enables shutdown hooks (stops the market timer and flush timer on a signal) and listens on `PORT`. It is bootstrap code, excluded from coverage and verified by the manual run.

## Cases

| ID     | Case                                                        | Input / setup                                                                                        | Expected                                                                                                                    | Level |
| ------ | ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | ----- |
| WIR-01 | A simple request from the allowed origin                    | `GET /api/stocks` with `Origin: http://localhost:5173`                                               | `access-control-allow-origin` equals that origin                                                                            | e2e   |
| WIR-02 | Another origin is never echoed                              | the same with `Origin: https://evil.example`                                                         | the header names only the configured origin, never `https://evil.example`, so a browser on that origin refuses the response | e2e   |
| WIR-03 | Preflight for the watchlist                                 | `OPTIONS /api/watchlist/AAPL` asking for `PUT` with header `x-client-id`                             | 204; allowed origin; methods include `PUT` and `DELETE`; allowed headers include `x-client-id`                              | e2e   |
| WIR-04 | The origin is never a wildcard                              | every response above                                                                                 | `access-control-allow-origin` is never `*`                                                                                  | e2e   |
| WIR-05 | The Socket.IO handshake follows the same policy             | polling handshake `GET /socket.io/?EIO=4&transport=polling` from the allowed origin and from another | configured origin for both; the other origin never echoed                                                                   | e2e   |
| WIR-06 | Socket.IO traffic is not swallowed by the non-API 404 guard | the handshake above                                                                                  | 200 with a Socket.IO open packet, not the shared 404 body                                                                   | e2e   |

## Coverage target

`cors-io.adapter.ts` and `app.setup.ts` are exercised by WIR-01 to WIR-06 and the other end-to-end suites (global 90% floor applies).

## Out of scope

Shutdown hook behavior on Windows (Nest documents that `SIGTERM` does not fire there; `SIGINT` and `SIGBREAK` do), TLS, reverse proxies.
