# Test matrix: server environment and bootstrap

Module: `apps/server/src/config/env.ts` (Zod schema) and `AppModule` wiring.

## Purpose and public surface

- `validateEnv`: synchronous wrapper used by `ConfigModule.forRoot({ validate })`; throws a readable error so startup fails before listening.
- `envSchema`: Zod schema for `NODE_ENV`, `PORT`, `CORS_ORIGIN`. Defaults make a bare `pnpm dev` work; anything invalid stops startup.
- `AppModule`: imports a global `ConfigModule` validated by `validateEnv` (`configModuleOptions`). Proves Nest dependency injection works under the test transformer (decorator metadata).

## Cases

| ID     | Area   | Case                                  | Input / setup                                                    | Expected                                                   | Level       |
| ------ | ------ | ------------------------------------- | ---------------------------------------------------------------- | ---------------------------------------------------------- | ----------- |
| ENV-01 | schema | Defaults apply to an empty env        | `{}`                                                             | `development`, `3000`, `http://localhost:5173`             | unit        |
| ENV-02 | schema | Valid values pass through             | `NODE_ENV=production PORT=8080 CORS_ORIGIN=https://nabd.example` | parsed object equals the input, `PORT` is a number         | unit        |
| ENV-03 | schema | `PORT` string is coerced to a number  | `PORT="4000"`                                                    | `4000` (number)                                            | unit        |
| ENV-04 | schema | `PORT` below range                    | `PORT=0`                                                         | validation error on `PORT`                                 | unit        |
| ENV-05 | schema | `PORT` above range                    | `PORT=65536`                                                     | validation error on `PORT`                                 | unit        |
| ENV-06 | schema | `PORT` not an integer                 | `PORT=3000.5`                                                    | validation error on `PORT`                                 | unit        |
| ENV-07 | schema | `PORT` not numeric                    | `PORT=abc`                                                       | validation error on `PORT`                                 | unit        |
| ENV-08 | schema | Unknown `NODE_ENV`                    | `NODE_ENV=staging`                                               | validation error on `NODE_ENV`                             | unit        |
| ENV-09 | schema | `CORS_ORIGIN` is not a URL            | `CORS_ORIGIN=localhost`                                          | validation error on `CORS_ORIGIN`                          | unit        |
| ENV-10 | env    | `validateEnv` throws a readable error | `{ PORT: "abc" }`                                                | message starts with "Invalid environment" and names `PORT` | unit        |
| ENV-13 | module | Config wiring rejects an invalid env  | `ConfigModule.forRoot(configModuleOptions)` with `PORT=abc`      | rejects with an "Invalid environment" `PORT` message       | integration |
| ENV-14 | env    | `validateEnv` returns parsed env      | `{ PORT: "5000" }`                                               | `PORT` is `5000` (number)                                  | unit        |
| ENV-11 | module | DI resolves `ConfigService`           | compile `AppModule` with defaults                                | `ConfigService.get('PORT')` is `3000`                      | integration |
| ENV-12 | http   | App boots and listens                 | `app.init()`, `GET /`                                            | `404` (no routes in the shell)                             | e2e         |

## Coverage target

- 90% global floor (statements, branches, functions, lines). `env.ts` is expected at 100%.
- Excluded, with reason: `src/main.ts` (process bootstrap: listens on a port, covered by a manual start check: `PORT=abc node dist/main.js` exits 1 with the validation message) and `src/**/*.module.ts` (module wiring, exercised by ENV-11 to ENV-13 but not counted as logic).

## Out of scope

Feature modules (market, stocks, realtime, watchlist) arrive in Phase 3 with their own matrices. Health endpoint and chaos flags are Phase 3.
