# Nabd (نبض)

Live markets, simulated. A small trading app: live stock list over WebSockets, stock detail with historical charts, and a watchlist.

> Nabd is an independent take-home project. It is not affiliated with any company, and all market data is simulated.

**Status:** Phases 0 to 4 complete: workspace tooling, quality gates, the shared contracts package (`@nabd/shared`), the whole backend (market simulator, REST, realtime gateway, watchlist) and the web foundation (design tokens and themes, English and Arabic with RTL, API and realtime layers, app shell). The pages are placeholders; the features arrive in Phases 5 and 6. This README is a skeleton and is completed in the final documentation phase.

## Requirements

- Node 24.13.0 (see `.nvmrc`)
- pnpm 12.23.0 (pinned in `packageManager`; `corepack enable` provides it)

## Get started

```sh
pnpm install
```

| Script              | What it does                                                        |
| ------------------- | ------------------------------------------------------------------- |
| `pnpm dev`          | Run every workspace's dev server (Turborepo)                        |
| `pnpm build`        | Build every workspace                                               |
| `pnpm lint`         | ESLint in each workspace, root tooling files, and Stylelint for CSS |
| `pnpm typecheck`    | TypeScript in each workspace                                        |
| `pnpm test`         | Vitest with coverage thresholds in each workspace                   |
| `pnpm test:e2e`     | Playwright (needs `pnpm exec playwright install chromium` once)     |
| `pnpm format`       | Prettier write                                                      |
| `pnpm format:check` | Prettier check                                                      |

## Repository layout

```
apps/web          React + Vite + Tailwind v4 app (port 5173)
apps/server       NestJS API and Socket.IO gateway (port 3000)
packages/shared   Zod contracts, routes, errors, socket events (compiled ESM)
packages/config   Shared tsconfig, ESLint, Prettier and Stylelint configs
docs/             PLAN.md, ADRs, test matrices, AI workflow
```

## How the rules are enforced

Rules live in tooling, so a change that breaks them is rejected rather than reviewed.

- **Editor:** `.editorconfig`, `.vscode/` (format and fix on save).
- **Pre-commit:** Prettier, ESLint (`--max-warnings 0`) and Stylelint on staged files.
- **commit-msg:** Conventional Commits (commitlint).
- **Pre-push:** typecheck and tests.
- **CI:** the same gates again, because hooks can be skipped and CI cannot.

The ESLint configs in `packages/config` encode the architecture (`app → features → shared/lib`, public `index.ts` per feature, network access only in `features/market-data` and `lib/api`), the design system (tokens only, logical properties only, no arbitrary values or color literals) and i18n (no literal strings in JSX). Inline `eslint-disable` comments are ignored.

## Planned sections

- Run it (dev, test, end to end)
- Architecture (diagram)
- Decisions and trade-offs (see `docs/decisions/`)
- How I worked with AI (see `docs/ai/`)
- What I would do next
- Screenshots

## Environment

Both apps validate their environment with Zod at startup and refuse to run on invalid values. Every variable has a default, so `pnpm dev` works with no setup. See `apps/server/.env.example` and `apps/web/.env.example`.

Server variables: `PORT` (3000), `CORS_ORIGIN` (`http://localhost:5173`), `MARKET_SEED` (`nabd`), `SIM_VOLATILITY_SCALE` (3, livelier than a real day), `SIM_STEP_MS` (100), `TICK_FLUSH_MS` (250), and the optional chaos flags `CHAOS_LATENCY_MS` (0) and `CHAOS_ERROR_RATE` (0).

## Server API

Everything is under `/api` and speaks the contracts in `@nabd/shared`. Successful responses are `{ data }`; every failure is `{ error: { code, message, details? } }`.

| Method and path                           | What it does                                              |
| ----------------------------------------- | --------------------------------------------------------- |
| `GET /api/health`                         | Liveness and uptime                                       |
| `GET /api/stocks`                         | All stocks with their current quote                       |
| `GET /api/stocks/:symbol`                 | One stock with its quote (404 if unknown)                 |
| `GET /api/stocks/:symbol/history?period=` | Candles for `1D`, `1W`, `1M`, `3M` or `1Y` (default `1D`) |
| `GET /api/watchlist`                      | The caller's watchlist, in the order items were added     |
| `PUT /api/watchlist/:symbol`              | Add a stock (idempotent)                                  |
| `DELETE /api/watchlist/:symbol`           | Remove a stock (idempotent, 204)                          |

Watchlist routes need an anonymous client ID in the `x-client-id` header (a UUID the browser generates once). It is identification, not authentication.

Realtime is Socket.IO on the same port. A client sends `subscribe` or `unsubscribe` with `{ symbols }` (up to 50) and receives `ticks` events (`{ ticks }`, batched every 250 ms, one event per symbol). Failures arrive as `server:error` with the same error shape as REST.

### Known limits

- The market is simulated and always open; prices are an approximate snapshot, not quotes (ADR 0004).
- Watchlists live in memory: they are lost on restart and the server cannot scale past one instance (ADR 0003).
- No rate limiting, and no authentication beyond the anonymous client ID.
- `SIGTERM` does not trigger Nest's shutdown hooks on Windows.
