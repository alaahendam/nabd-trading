# Mobile M0: shared core

Part of `docs/MOBILE-PLAN.md` (section 2 and section 5). Goal: code that is not tied to the DOM or to React Native moves out of `apps/web` into packages, so the mobile app can use one implementation. **The web app's behaviour does not change.**

## Rules for every task

- Each task is one commit (a refactor of finished code must be easy to revert) and leaves the repo green: format, lint, typecheck, tests with their thresholds, build, and, where the web is touched, the E2E suite.
- Files move with `git mv`, tests and test matrices with the code they cover. No assertion is weakened and no threshold is lowered.
- Every new package follows `@nabd/shared`: compiled ESM in `dist` with an `exports` map, `tsc --watch` for `dev`, Vitest with a coverage threshold, `react` and other framework libraries as **peer** dependencies, never dependencies.
- New packages must not import from apps, React DOM or React Native. A package that needs the platform takes it as an argument (a scheduler, a storage object, a connectivity source).
- No package depends on a package that depends on it (no cycles).

## Package graph

```
@nabd/shared        (contracts)             <- everything
@nabd/api-client    -> shared
@nabd/domain        -> shared              (candles, summary, custom range)
@nabd/data          -> shared, api-client, domain; peers: react, @tanstack/react-query
@nabd/market-data   -> shared; peers: react; dependency: socket.io-client
@nabd/i18n          -> shared               (resources, formatters, language rules); peers: i18next
@nabd/tokens        (no dependencies)       (typed tokens, CSS generator, contrast test)
@nabd/testing       -> shared               (recorders, fakes, fixtures); no framework imports
```

`@nabd/testing` does not import `@nabd/market-data` or `@nabd/api-client`: its fakes are typed structurally, so a fake socket or API satisfies the real interface at the place it is used (a mismatch is a compile error there), and the package graph stays acyclic.

## Tasks

- [x] **T1 `@nabd/testing`.** Plain recorders (a function with `calls`, and `resolves`, `rejects`, `rejectsOnce`, `returns`, `implement`), `createFakeApi`, `FakeSocket`, and the data fixtures. The web harness moves to them: the ~140 uses of `vi.fn` API spies in 16 test files become recorder calls with the same meaning (`toHaveBeenCalledTimes(n)` becomes a length check on `calls`, `toHaveBeenCalledWith(...)` becomes `toContainEqual`). The fake chart stays in the web app (it fakes a web-only port). Done with two prerequisite commits: the client-side request shapes (`HistoryRange`, `StocksListQuery`, `StocksPage`) moved into `@nabd/shared`, so the fakes are typed without depending on `@nabd/api-client`; and the `portable` TypeScript and ESLint preset in `@nabd/config` that every new package uses. The mock API handlers (`msw`) moved too, as the subpath `@nabd/testing/msw`.
- [ ] **T2 `@nabd/api-client`.** `lib/api`: errors, client ID (with its storage passed in), endpoints, the HTTP client. The React `ApiProvider` stays in the web app.
- [ ] **T3 `@nabd/domain`.** `candles`, `chart-summary` (`summarizeHistory`), `custom-range`. Pure functions. `HistoryRange` moves with them if `custom-range` needs it.
- [ ] **T4 `@nabd/market-data`.** `PriceStore`, `RealtimeClient`, staleness, connection status, the Socket.IO adapter and the React bindings. `RealtimeProvider` takes a connectivity source instead of reading `window` and `navigator`; the web app supplies the browser one. The scheduler for frame batching is already injectable.
- [ ] **T5 `@nabd/data`.** Query keys, the query client defaults, the paged list, stock and history queries, and the optimistic watchlist mutation with rollback.
- [ ] **T6 `@nabd/i18n`.** The English and Arabic resources and their typed keys, the language rules, and the formatters. The browser language store and the React provider stay in the web app.
- [ ] **T7 `@nabd/tokens`.** The tokens as typed TypeScript values, a script that generates the web's `tokens.css` from them, a CI check that the generated file is current, and the contrast test. The colour-literal exceptions in ESLint and Stylelint point at the tokens package.
- [ ] **T8 Close-out.** ADR for why these packages and why now, the Amendment to ADR 0002 (the mobile app uses jest-expo), README folder structure, `CLAUDE.md` architecture rules, matrices and paths updated, bundle size compared with the baseline.

## Baseline (after the React pin, ADR 0010)

- Tests: 170 shared, 307 server, 574 web, 38 end to end.
- Web first load: 586.6 kB raw, 181.9 kB gzip (react 313.9 / 98.8, data 163.8 / 47.3, i18n 55.6 / 18.1, app 52.6 / 17.3, runtime 0.7 / 0.4); chart chunk 165.5 / 53.6.

## Gate for the phase

Web fully green with E2E, coverage thresholds unchanged or moved with their code, the bundle unchanged or the difference explained, no new package imports an app, React DOM or React Native, and each new boundary rule shown to fail on a deliberate violation.
