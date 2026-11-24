# Implementation Plan: Phase 2, `packages/shared`

Source: `docs/PLAN.md` section 6, Phase 2. Working agreement: `CLAUDE.md`. The Phase 1 plan was fully checked off and is kept in git history.

## Overview

`@nabd/shared` is the single source of truth for every contract between web and server: Zod schemas with the types derived from them, REST routes, the API error shape, the anonymous identity header, socket event names with typed payloads, and the period configuration. No runtime behavior beyond validation. It must be fully tested (100% coverage) before Phase 3 builds the server against it.

## Interface design (api-and-interface-design)

- **Contract first.** Schemas are written and tested before any consumer exists. Types are only ever `z.infer` of a schema.
- **One time convention.** Every timestamp is epoch milliseconds (integer). The chart layer converts as needed.
- **One error shape.** `{ error: { code, message, details? } }` with a closed set of codes and a code to HTTP status map, so server filter and client agree.
- **Envelopes are additive.** Lists return `{ data: [...] }` so pagination can be added later as an optional field without breaking clients. The stock universe is fixed and small, so no pagination now (decision recorded here, not an oversight).
- **Input and output are separate.** `AddWatchlistInput` is not `WatchlistItem`.
- **Validate at boundaries only.** Server validates request bodies, queries and socket payloads; web validates responses and socket payloads from the network. Internal code trusts the types.
- **Closed vocabularies.** Periods, error codes, exchanges and socket events are `as const` values, never loose strings.
- **Refined schemas are final.** Zod 4 `.extend()` throws on refined objects, so OHLC consistency refinements sit on the schemas that are not extended.
- **One entry point.** Only `.` is exported; the architecture rule already forbids deep imports.

## Packaging decision

Built with `tsc` to `dist` (ESM, NodeNext, declarations). Nest runs compiled JS and Vite resolves ESM, so a compiled package is the one form both consume. Turbo already runs `^build` before lint, typecheck and test. A new `library` tsconfig base goes in `@nabd/config`. `dev` is `tsc --watch`.

## Task list

### Slice 1: Foundation and market contracts

- [x] Task 1: `library` tsconfig base in `@nabd/config`
  - Acceptance: strict, NodeNext, declarations, no DOM or Node types. Verify: `@nabd/config` typecheck.
  - Scope: XS
- [x] Task 2: `@nabd/shared` package with `Stock`, `Quote`, `PriceTick`, `HistoryPoint`, `Period` and period config
  - Acceptance: matrix `docs/testing/shared-market.md` first; valid and invalid payloads for every schema; OHLC consistency refinement; 100% coverage; builds to `dist`.
  - Verify: `pnpm --filter @nabd/shared lint typecheck test build`.
  - Files: `package.json`, `tsconfig*.json`, `vitest.config.ts`, `eslint.config.js`, `src/{index,market,period}.ts` and tests.
  - Scope: M

### Checkpoint: Market contracts

- [x] Gates green for `@nabd/shared`, committed.

### Slice 2: Watchlist, identity and errors

- [x] Task 3: `WatchlistItem`, add input, client ID header and schema, API error shape, error code to status map, routes
  - Acceptance: matrix `docs/testing/shared-api.md` first; error codes closed; routes build escaped symbol paths; 100% coverage.
  - Scope: M

### Slice 3: Realtime contracts

- [x] Task 4: Socket event names, payload schemas, typed event maps, room name helper
  - Acceptance: matrix `docs/testing/shared-socket.md` first; subscribe/unsubscribe payload limits; batched tick payload; event maps usable with `socket.io` generics; 100% coverage.
  - Scope: M

### Checkpoint: Complete

- [x] Task 5: Whole-repo gates; a throwaway import of `@nabd/shared` proves it resolves in Nest (NodeNext), Vite and Vitest; the deep-import rule rejects `@nabd/shared/...`; README and docs updated.
  - Scope: S

## Risks and mitigations

| Risk                                                        | Impact | Mitigation                                                                |
| ----------------------------------------------------------- | ------ | ------------------------------------------------------------------------- |
| Compiled ESM package not resolvable by Nest, Vite or Vitest | High   | Throwaway import in each consumer in Task 5, before Phase 3 depends on it |
| Schema churn after Phase 3 starts                           | Med    | Additive-only rule, 100% tests, envelopes, closed enums documented above  |
| `dist` stale during development                             | Low    | `dev` runs `tsc --watch`; turbo builds dependencies before test and lint  |
| Zod refinement limits (no `.extend` on refined objects)     | Low    | Refine only terminal schemas; documented above                            |

## Open questions

- None blocking. Stock symbols and the universe belong to the server (Phase 3), not to shared.
