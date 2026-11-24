# Implementation Plan: Phase 3, backend

Source: `docs/PLAN.md` section 6, Phase 3. Working agreement: `CLAUDE.md`. Earlier phase plans are fully checked off and kept in git history. Decisions: ADR 0003 (in-memory watchlist), ADR 0004 (simulation design).

## Overview

Build the whole backend before any frontend feature: a seeded market simulator with deterministic history, REST for stocks, a Socket.IO gateway with rooms and batched ticks, an anonymous-identity watchlist, a global validation pipe and error filter, CORS, a health endpoint and optional chaos flags. Everything speaks the contracts in `@nabd/shared`. Domain logic (simulator, history generator, watchlist service, tick batcher) is covered at 100%.

## Threat model (security-and-hardening)

Trust boundaries: HTTP params, query and headers; socket payloads; env. Everything crossing them is validated with the shared Zod schemas before use.

- **Spoofing:** the client ID is anonymous by design (documented). A watchlist is only reachable with its own ID; the guard rejects a missing or malformed ID. Swapping in a JWT guard keeps the same `@CurrentUser()` contract.
- **Tampering / injection:** no database, no shell, no file paths from input. Path params and query are parsed by schemas.
- **Information disclosure:** one error shape; unknown errors answer a generic message and never a stack trace; details only for validation failures.
- **Denial of service:** socket subscribe limited to 50 symbols per message; unknown symbols rejected; batching bounds emit rate; JSON body size is Nest's default limit and there are no body endpoints. No rate limiting (single instance, demo), noted as a gap in the README.
- **CORS:** explicit single origin from env, never `*`.
- **Security headers:** `helmet` on the HTTP app.

## Interface design

Controllers are thin. Routes come from `ROUTES`, bodies and responses from shared schemas, errors from `createApiError`/`ERROR_STATUS`. Server modules talk only through exported providers (`index.ts`), enforced by lint.

## Task list

### Slice 1: Foundation (vertical through the stack)

- [ ] Task 1: `@nabd/shared` health contract (`ROUTES.health`, `healthResponseSchema`), test-first.
  - Scope: XS
- [ ] Task 2: common foundation and health endpoint
  - Acceptance: `ApiException`, catch-all filter producing the shared error shape (unknown errors generic, no stack), `ZodValidationPipe`, global prefix `/api`, helmet, `GET /api/health`; env gains `MARKET_SEED`, `CHAOS_LATENCY_MS`, `CHAOS_ERROR_RATE`; matrix `docs/testing/server-common.md` first.
  - Verify: supertest e2e on 404 route, validation failure, unknown error, health.
  - Scope: M

### Slice 2: Market domain (pure, 100% coverage)

- [ ] Task 3: seeded RNG and stock universe
  - Acceptance: deterministic streams per seed, normal and exponential draws, stable string hash; universe of real tickers, every entry passes `stockSchema` and has a positive snapshot price, beta and volatility; matrix `server-market-rng.md`.
  - Scope: M
- [ ] Task 4: live simulator
  - Acceptance: every quote passes shared `quoteSchema` after any number of steps; deterministic per seed; positive cent-rounded prices; shared market factor correlates stocks; volatility clusters; irregular tick times; day rollover sets previous close; matrix `server-market-simulator.md`.
  - Scope: L, split in two commits (state and stepping, then day rollover and ticks).
- [ ] Task 5: history generator
  - Acceptance: every result passes `historyDataSchema`; last close equals the current price; deterministic for the same inputs; ascending, bucket-aligned times; day gaps at UTC boundaries; correct point count per period; matrix `server-market-history.md`.
  - Scope: M

### Checkpoint: Market domain

- [ ] Domain tests green at 100%, committed.

### Slice 3: Stocks REST

- [ ] Task 6: market service (clock, tick stream) and stocks controller
  - Acceptance: `GET /api/stocks`, `/api/stocks/:symbol`, `/api/stocks/:symbol/history?period=`; responses validate against shared response schemas; unknown symbol 404, bad symbol or period 422; matrix `server-stocks.md`.
  - Scope: M

### Slice 4: Watchlist

- [ ] Task 7: identity guard, `@CurrentUser()`, watchlist service, repository and controller
  - Acceptance: missing or malformed `x-client-id` gives 401 `CLIENT_ID_REQUIRED`; `PUT` adds idempotently (keeps first `addedAt`), `DELETE` removes idempotently, `GET` lists in added order; unknown symbol 404; clients are isolated from each other; matrix `server-watchlist.md`; service at 100%.
  - Scope: M

### Checkpoint: REST complete

- [ ] All REST e2e green, committed.

### Slice 5: Realtime

- [ ] Task 8: tick batcher and gateway
  - Acceptance: subscribe/unsubscribe join and leave per-symbol rooms; invalid payloads and unknown symbols answer `server:error` and never crash; the current tick is sent on subscribe; live ticks are batched per flush interval and sent per room; disconnect cleans up; matrix `server-realtime.md`; batcher at 100%; end-to-end with `socket.io-client`.
  - Scope: L, split in two commits (batcher, then gateway).

### Slice 6: Operations

- [ ] Task 9: chaos interceptor (latency and error rate from env, never on health)
  - Scope: S
- [ ] Task 10: `main.ts` wiring (prefix, helmet, CORS also for Socket.IO through an adapter, shutdown hooks), manual run with curl and a socket client, README and docs, whole-repo gates
  - Scope: S

## Risks and mitigations

| Risk                                               | Impact | Mitigation                                                                |
| -------------------------------------------------- | ------ | ------------------------------------------------------------------------- |
| Simulator output violates the shared refinements   | High   | Property-style tests parse every quote and candle with the shared schemas |
| Gateway is not covered by global filters and pipes | High   | Validate and answer inside the gateway explicitly; test invalid payloads  |
| Socket.IO CORS not applied through Nest            | Med    | Custom IoAdapter; test the CORS header on the polling handshake           |
| Gateway e2e without documented pattern             | Med    | `app.listen(0)` plus `socket.io-client`; proven in the first gateway test |
| Timers make tests flaky                            | Med    | Injected clock and fake timers; no real sleeps in unit tests              |
| Plan size: this is the largest phase               | Med    | One commit per task, green at each, checkpoints after slices 2, 4         |

## Open questions

- None blocking. Stock prices are an approximate snapshot, labeled as simulated.
