# 0011. Shared packages for the web and the mobile app

- Status: accepted
- Date: 2026-11-25

## Context

`docs/MOBILE-PLAN.md` adds a mobile app next to the web app. The valuable, hard-won code is not in the screens: it is the realtime layer, the API client with its validation, the query and optimistic update logic, the candle math, the translations and formatters, and the design tokens. All of it was written inside `apps/web`. Copying it into the mobile app would make two versions drift apart, and the web's tests would stop protecting the mobile app.

## Decision

Everything that is not tied to the DOM or to React Native moves out of `apps/web` into packages, as seven extractions, each its own commit with its tests, with the web app's behaviour unchanged.

| Package             | Holds                                                                                                              | Depends on                                      |
| ------------------- | ------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------- |
| `@nabd/shared`      | contracts (Zod), routes, errors, socket events, and now the client-side request shapes (`HistoryRange`, ...)       | (nothing)                                       |
| `@nabd/api-client`  | the HTTP client, endpoints, error type, client ID provider (storage is passed in)                                  | shared                                          |
| `@nabd/domain`      | candle math, `summarizeHistory`, custom range validation                                                           | shared                                          |
| `@nabd/market-data` | `PriceStore`, `RealtimeClient`, staleness, the Socket.IO adapter, the React bindings; the only owner of the socket | shared; peer react                              |
| `@nabd/data`        | query keys and defaults, stock, history and watchlist hooks with optimistic updates, the API context               | api-client, shared; peers react, TanStack Query |
| `@nabd/i18n`        | English and Arabic resources with typed keys, language rules, `createI18n`, the formatters                         | peers i18next, react-i18next                    |
| `@nabd/tokens`      | the palette and the light and dark semantic layers as typed values, the `tokens.css` generator, the contrast tests | (nothing)                                       |
| `@nabd/testing`     | recorders (no `vi.fn` or `jest.fn` inside), the fake API and socket, fixtures, mock API handlers                   | shared                                          |

How they are kept portable:

- **The platform is an argument.** A package never reads the browser. The realtime provider takes a `Connectivity` (online or not, and when it changes), the client ID provider takes a storage object, the price store already took a scheduler and a clock. The web supplies the browser versions (`lib/connectivity`, `lib/api/browser-client-id`); the mobile app will supply its own.
- **A shared preset enforces it.** `@nabd/config` has a `portable` TypeScript config (DOM types only for `fetch`, `AbortSignal` and timers) and a `portable` ESLint config: no `window`, `document`, `navigator`, storage or `location`, no `fetch`, `XMLHttpRequest` or `WebSocket`, no React DOM, React Native, socket or chart library imports, no app imports, no deep imports into a package, and no color literals. A package relaxes only the one rule it exists to own: `api-client` may call `fetch`, `market-data` may import `socket.io-client`, `tokens` may hold colors. Each rule was shown to fail on a deliberate violation.
- **Compiled ESM, like `@nabd/shared`.** Each package builds to `dist` with an `exports` map, and `react` and the other framework libraries are peer dependencies.
- **No cycles.** The testing package is typed from the shared contracts and does not import `api-client` or `market-data`, so a fake satisfies the real interface at the place it is used and the compiler checks the two still match.
- **The web keeps what is web.** The browser connectivity and client ID, the language store and its React provider (they use `localStorage`, `document` and `navigator`), the chart adapter, the app shell and every component.

## Alternatives considered

- **Copy the code into the mobile app.** Rejected: two copies drift, and every fix has to be made twice.
- **One `@nabd/core` package with everything.** Rejected: a screen that only needs the candle math would still pull in the socket client, the package's boundaries could not be enforced, and unrelated parts change at different speeds.
- **Package source (TypeScript) instead of compiled output.** Not chosen: `@nabd/shared` already ships compiled, and one mechanism is simpler. Whether Metro resolves the compiled `exports` is the first spike of the mobile shell (M1), not yet answered.

## Consequences

- The web app is the same product: 1,051 unit and component tests became 1,096 across ten workspaces (the 45 extra test the new seams: the recorders and fakes, the browser connectivity, the filtered stock list, the tokens generator and resolution), the 38 browser tests pass, and the first load is 586.7 kB raw and 182.1 kB gzip against 586.6 and 181.9 before, a difference of 0.1 kB.
- Each package has its own Vitest config and a 100% coverage threshold. Tests run in Node by default; a test that renders React opts into jsdom for itself, which is how two tests that had quietly relied on jsdom's `requestAnimationFrame` were found.
- `pnpm dev` builds the packages first and then watches each of them with `tsc --watch`.
- A package's TypeScript module augmentation does not travel with it, so each app types `t()` with its own `i18next.d.ts`.
- If the mobile app needs something that is still in the web app, the move is one more extraction in the same style.
