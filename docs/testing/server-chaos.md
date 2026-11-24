# Test matrix: chaos flags

Module: `src/modules/chaos` (`ChaosInterceptor`, options, module). Optional per `docs/PLAN.md` section 7.

## Purpose and public surface

For exercising the frontend's loading, error and retry states against a misbehaving API, two environment flags add trouble to HTTP requests:

- `CHAOS_LATENCY_MS` (integer 0 to 10 000, default 0): every HTTP response is delayed by this long.
- `CHAOS_ERROR_RATE` (number 0 to 1, default 0): this share of HTTP requests fails with `503 SERVICE_UNAVAILABLE` in the shared error shape, before the handler runs.

`ChaosInterceptor` is registered globally. With both flags at 0 (the default) it does nothing. It never touches `GET /api/health` (a health check must stay truthful) or non-HTTP traffic (the socket gateway). The randomness source is injected so tests are deterministic.

## Cases

| ID     | Case                                     | Input / setup                                                       | Expected                                                                                                                              | Level |
| ------ | ---------------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ----- |
| CHS-01 | Off by default                           | latency 0, error rate 0                                             | the handler's result passes through unchanged, no delay, the random source is not consulted                                           | unit  |
| CHS-02 | Latency delays the response              | latency 500, fake timers                                            | nothing before 500 ms; the handler's result at 500 ms                                                                                 | unit  |
| CHS-03 | The error rate fails requests            | rate 0.3 with random `0.1`; random `0.9`                            | `ApiException` `SERVICE_UNAVAILABLE` (503), handler not called; the second passes through                                             | unit  |
| CHS-04 | Boundaries of the rate                   | rate 1 with random `0.999`; rate 0.3 with random `0.3`              | fails; passes (the comparison is strict)                                                                                              | unit  |
| CHS-05 | Health is exempt                         | path `/api/health`, rate 1, latency 500                             | passes through at once                                                                                                                | unit  |
| CHS-06 | Non-HTTP contexts are exempt             | a `ws` context, rate 1                                              | passes through                                                                                                                        | unit  |
| CHS-07 | Both flags together                      | latency 200, rate 1                                                 | the failure also waits 200 ms                                                                                                         | unit  |
| CHS-08 | The real app fails requests when told to | app with rate 1: `GET /api/stocks` and `GET /api/health`            | 503 in the shared error shape; health answers 200                                                                                     | e2e   |
| CHS-09 | Env validation                           | `CHAOS_LATENCY_MS` and `CHAOS_ERROR_RATE`: defaults, valid, invalid | defaults 0 and 0; `250` and `0.5` accepted; `-1`, `10001`, `1.5` and `abc` for latency, `-0.1`, `1.1` and `abc` for the rate rejected | unit  |

## Coverage target

100% for `chaos.interceptor.ts` (per-file threshold).

## Out of scope

Chaos for the socket gateway (disconnects, dropped ticks); a real network between client and server.
