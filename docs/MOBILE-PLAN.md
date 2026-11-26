# Nabd Mobile — Plan

Status: agreed scope, architecture and execution order for the mobile app, revised after the plan review of 2026-11-25. Lives on the `feat/mobile` branch. `docs/PLAN.md` and `CLAUDE.md` still apply in full; this file adds what is specific to mobile. Where they disagree, stop and ask.

## 0. Context and honesty

The take-home is assessed on the web app, which is where the author's experience is, so the web app and the server were built first and released as `v1.0.0`. React Native is outside the author's experience. With time left, the mobile app was added as an AI-led ("vibe-coded") extension: the agent leads the native details, and the app is held to the same architecture, lint rules, tests and CI as the web app. The author reviews behaviour, structure and every diff, not every native detail. This is stated in the README and in `docs/ai`, in the author's words, when the branch is finished.

**Platforms and testing.** Android only, in practice.

- Real-device testing happens on the author's Android phone, with a development build while working and the APK for the final check.
- The Android emulator is used for quick checks and for small and large screen sizes.
- **iOS is source-only and untested.** The author works on Windows and has no Apple Developer account, so nothing here is built, run or checked on iOS. The README and the honesty statement say so plainly. The code uses only cross-platform APIs, but that is intent, not evidence.
- Expo Go is not used and is not a reviewer route (see section 1).

The branch is merged into `main` (and tagged `v1.1.0`) only if it reaches the same bar as the web app. If it does not, it stays a documented experimental branch.

## 1. Locked decisions

| Area              | Decision                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| App               | `apps/mobile`, package `@nabd/mobile`, **Expo SDK 58**, TypeScript strict, Hermes. The New Architecture is not a choice: it is always on since SDK 55. SDK 58 pairs with React Native 0.88 and React 19.3.0 and needs Node 22.13 or newer, per the Expo docs read on 2026-11-25; these facts are re-checked by the author on the official pages at M1 step 0                                                                |
| Identity          | Same as web: name Nabd, IBM Plex Sans and IBM Plex Sans Arabic, the same palette and semantic tokens, light, dark and system themes, the same copy in English and Arabic, the "simulated data" notice on every screen                                                                                                                                                                                                       |
| Navigation        | Expo Router (file-based, built on React Navigation). Stack for detail, tabs for Markets and Watchlist. **Typed routes are enabled** (beta in the docs); CI generates the route types with `npx expo customize tsconfig.json`. If the beta causes problems, fall back to a small typed route helper and record it in an ADR                                                                                                  |
| Server state      | TanStack Query, wired to React Native: `focusManager` on `AppState` (not on web), `onlineManager` on `expo-network` or NetInfo, chosen in M2                                                                                                                                                                                                                                                                                |
| Live prices       | The same `PriceStore` and `RealtimeClient` as web, moved to a shared package. One socket for the app, ref-counted subscriptions, per-frame batching, read with `useSyncExternalStore` per symbol                                                                                                                                                                                                                            |
| App lifecycle     | The socket disconnects when the app goes to the background and reconnects and resubscribes when it comes back. Prices from before the pause are marked stale until a fresh tick arrives                                                                                                                                                                                                                                     |
| Lists             | **FlashList v2** for the stock list and watchlist (no size estimates; recycles cells). Rows re-render only for their own symbol, and a recycling test proves a row keeps the right symbol and price after scrolling                                                                                                                                                                                                         |
| Styling           | `StyleSheet` with a typed theme from the shared tokens (no hard-coded values). No styling library unless the M1 review shows a clear need; if one is added, it gets an ADR                                                                                                                                                                                                                                                  |
| RTL               | **Every style uses start and end from the first line of M2**, enforced by a local lint rule (section 3). M4 keeps only the runtime language switch (see i18n) and its testing                                                                                                                                                                                                                                               |
| Chart             | Decided by a spike in M3 between **three candidates**: `victory-native`, custom candles drawn with Skia, and a WebView running Lightweight Charts. Measured on the same data (frame rate while ticking, period switch time, bundle size, accessibility, look), decided in an ADR. The chart stays behind the same kind of port as on web                                                                                    |
| Chart text        | In every case the chart has a native text summary, like the web's: period, start and end price, change, high and low, translated, updating with the period (the shared `summarizeHistory`). A WebView chart is not accessible by itself, so the summary is not optional                                                                                                                                                     |
| Chart attribution | If the WebView and Lightweight Charts win, the attribution link to tradingview.com and the NOTICE text must be visible on a screen the user can reach. The same applies to any other library with a notice                                                                                                                                                                                                                  |
| Storage           | **AsyncStorage** (included in Expo; MMKV needs a native module and a dev build and is not worth it for three small values). It holds the client ID, theme and language. The **splash screen is held until theme and language have been read**, so there is no wrong-theme or wrong-language flash. The client ID is not a secret                                                                                            |
| Config            | `EXPO_PUBLIC_API_URL` is **required, with no default**. It is read with a static `process.env.EXPO_PUBLIC_API_URL` reference (Expo only inlines static references) and validated with Zod at runtime. If it is missing or invalid, the app shows a readable configuration error screen, never a blank one. See section 7 for where values come from                                                                         |
| i18n              | Same resources as web (moved to a shared package). Since SDK 58 the layout follows the device language by default. The in-app language switch uses `I18nManager.allowRTL` and `forceRTL`, then `Updates.reloadAsync()` (`expo-updates`), with `LocaleProvider` from Expo Router around the root stack. It does not work in Expo Go, so it is tested on the dev build or the APK, done in M4                                 |
| Testing           | **Vitest everywhere except `apps/mobile`**, which uses jest-expo (Jest 30 on SDK 58) and React Native Testing Library 14 (it needs the `test-renderer` peer; `react-test-renderer` does not support React 19). The shared packages keep their Vitest suites. Coverage thresholds as on web: 100% on domain logic, 90% overall. Maestro flows for the main path, run locally against the dev build or the APK and documented |
| Test fakes        | A `@nabd/testing` package with framework-agnostic fakes (socket, API): plain recorders, no `vi.fn` or `jest.fn` inside, usable from Vitest and Jest                                                                                                                                                                                                                                                                         |
| React version     | Web and mobile are pinned to the exact React version SDK 58 requires, with a root-level rule (pnpm overrides) so a second copy of React cannot appear. The web needs a patch downgrade (it is on 19.3.1 and SDK 58 pins 19.3.0), which must keep every web unit, component and E2E test green. Short ADR                                                                                                                    |
| Touch targets     | 48 minimum, which covers 44 pt on iOS and 48 dp on Android                                                                                                                                                                                                                                                                                                                                                                  |
| Tokens            | The ESLint color-literal exception and the WCAG contrast test move from the web's CSS to the tokens package, so the typed values are the single place with color literals and the contrast test checks them directly                                                                                                                                                                                                        |
| Distribution      | **An Android APK from EAS internal distribution is the reviewer route.** Expo Go is not a reviewer route (Expo's own review guide says so, it needs a login and a matching SDK, and it bundles a fixed set of native libraries). iOS is source-only. Free-plan EAS builds are limited (15 per platform, a slow queue), so APKs are built rarely, not per commit                                                             |

## 2. Shared code (M0)

Code that is not tied to the DOM or to React Native moves out of `apps/web` into packages, so both apps use one implementation. The packages and their exact boundaries are confirmed in the M0 plan before any move; the list below is the intended shape.

| Package             | Contents                                                                                                                                                                                                                                |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@nabd/market-data` | `PriceStore`, `RealtimeClient`, subscription ref-counting, staleness, connection status, the React bindings. Platform hooks injected (scheduler for frame batching, online/offline and lifecycle signals). `react` is a peer dependency |
| `@nabd/api-client`  | The fetch-based API client with Zod validation of every response, error mapping, the client ID header                                                                                                                                   |
| `@nabd/domain`      | DOM-free domain logic: candle math (`candles`, `applyLivePrice`), `summarizeHistory`, custom-range validation. Pure functions. Period config already lives in `@nabd/shared`; M0 only checks that nothing duplicates it                 |
| `@nabd/data`        | TanStack Query keys and query options, the paged list and history queries, and the optimistic watchlist mutation logic with rollback, on top of `@nabd/api-client`. `react` and `@tanstack/react-query` are peers                       |
| `@nabd/i18n`        | Translation resources and their typed keys, and the formatters (prices, percentages, dates, `ar-u-nu-latn`)                                                                                                                             |
| `@nabd/tokens`      | Design tokens as typed TypeScript values: primitives and the semantic layer for light and dark. The web's tokens CSS is generated from them by a script, and CI fails if the generated file is out of date. Owns the contrast test      |
| `@nabd/testing`     | Framework-agnostic fakes: socket, API. Plain recorders that keep their calls in arrays and expose helpers; a test adapts them (`vi.fn`, `jest.fn`) at its own edge                                                                      |

Rules for M0:

- **First step: the React pin.** Pin web to the exact React that SDK 58 requires, add the root-level rule, run every gate and the E2E suite, and record it in a short ADR. Nothing else moves until this is green.
- The web app's behaviour does not change. Every web unit, component and E2E test stays green, coverage stays at its thresholds, and the bundle size is measured before and after. The web harness moves to the `@nabd/testing` recorders without weakening any assertion.
- Each extraction is its own commit, because each one is a refactor of finished code and should be easy to revert. Tests and test matrices move with the code they cover.
- ESLint boundaries are updated so the new packages cannot import from apps, React DOM or React Native, and the `socket.io-client` and fetch restrictions follow the code into its packages.
- ADRs: why these packages and why now; the React pin; an Amendment to ADR 0002 recording that `apps/mobile` uses jest-expo because the React Native tooling requires it, while everything else stays on Vitest.

## 3. Mobile architecture

```
apps/mobile
  app/                  Expo Router routes only (thin): (tabs)/index, (tabs)/watchlist, stock/[symbol], +not-found
  src/providers         providers (query client, theme, i18n, realtime), lifecycle wiring, error boundary, configuration error screen
  src/features          stocks (list, detail, chart), watchlist, market-data (the only socket wiring)
  src/lib               api, storage, env, theme, i18n setup
  src/shared/ui         small components: Text, Button, IconButton, Card, Badge, Tabs, Skeleton, PriceText, ChangeBadge, ConnectionStatus, Screen
  src/test              harness: providers, adapters from @nabd/testing
```

The providers folder is `src/providers`, not `src/app`, so nothing can clash with Expo Router's `app` directory.

The same rules as web, enforced by ESLint:

- Imports flow `app → features → shared/lib`; features expose a public `index.ts`; route files only compose features.
- `socket.io-client` only in the `market-data` package; network only through `@nabd/api-client`.
- React Native rules: no inline styles, no color literals, no raw text outside the `Text` component, **no physical direction properties**, every visible string through i18n, `accessibilityRole` and `accessibilityLabel` on interactive elements.
- The physical direction rule rejects `left`, `right`, `marginLeft`, `marginRight`, `paddingLeft`, `paddingRight`, `borderLeft*`, `borderRight*`, `borderTopLeftRadius` and the other physical forms, and `textAlign: 'left'` and `'right'`. Styles use `start` and `end` (`marginStart`, `paddingEnd`, `borderStartWidth`, `textAlign: 'auto'`).
- Theme values only from the typed theme; spacing, radii and type sizes come from tokens.

How the rules are built: `eslint-plugin-react-native` has `no-inline-styles`, `no-color-literals` and `no-raw-text`, but its README says it is in low-activity mode and documents only the legacy config. At M1 each rule is tried under flat config on ESLint 9 (held there by ADR 0001). A rule that does not work is written locally in the same package as the other custom rules. The physical-direction rule is always local, because no standard plugin has one. The M1 gate stands: every mobile rule is shown to fail on a deliberate violation.

## 4. Mobile quality bar

- Every state designed: loading skeletons, empty, error with retry, offline and reconnecting, stale price, unknown symbol, and the configuration error screen.
- Accessibility: roles and labels on every control, the star is a toggle with its state announced, Dynamic Type respected (layouts checked at large font scale on the emulator), reduce motion respected, live prices never announced on every tick, touch targets at least 48, a native text summary for the chart.
- RTL-safe from the first screen (start and end only, enforced by lint); the runtime language switch comes in M4.
- Safe areas, keyboard handling, pull to refresh on lists, haptic feedback on the star.
- App icon and splash screen with the Nabd mark; the splash stays until theme and language are read.
- No sideways overflow on small phones; checked on a small and a large emulator screen and on the author's phone.
- Android only is verified. iOS is not, and the documentation says so.

## 5. Execution order (each phase is reviewed and committed before the next)

**Housekeeping, before any code.** Two repository settings for this branch:

- Vercel must not deploy this branch: `git.deploymentEnabled` in `apps/web/vercel.json` turns off `feat/mobile`. Vercel reads the file from the branch being deployed, so the entry is removed again when the branch is merged.
- A draft pull request into `main` keeps CI running on the branch (`ci.yml` runs on pushes to `main` and on pull requests only). It stays a draft until M5.

**M0 — Shared core.** The React pin first (section 2), then extract `@nabd/testing`, `@nabd/market-data`, `@nabd/api-client`, `@nabd/domain`, `@nabd/data`, `@nabd/i18n`, `@nabd/tokens`, one commit each. Test matrices for any moved module that gains platform hooks. Gate: web fully green, E2E included, coverage and bundle size unchanged or explained.

**M1 — Expo shell and tooling.**

- **Step 0, by the author:** re-check the key facts on the official pages (SDK 58, its React Native and React versions, jest-expo and React Native Testing Library versions, the Node requirement) before anything is created.
- Create `apps/mobile` with the Expo template that fits, then bring it under the repo's TypeScript, ESLint (plus the mobile rules of section 3), Prettier and commit rules. jest-expo, env validation with the configuration error screen, a CI job (lint, typecheck, test, `expo-doctor`, route type generation, an export build).
- **Early spike: Metro resolving the shared packages' compiled ESM `exports`**, with pnpm's isolated install (the default). If isolated installs fail for a library, the fallback is `nodeLinker: hoisted`, which affects the whole workspace and needs an ADR and a check that web is unaffected.
- Gate: lint, typecheck, test, build green on the empty app, and each new mobile lint rule shown to fail on a deliberate violation.

**M2 — Foundation.** Theme from `@nabd/tokens` (light, dark, system, persisted in AsyncStorage) with the splash hold, fonts, Expo Router with tabs and the detail stack, query client wired to `AppState` and the network state, the realtime layer with lifecycle handling, i18n in English, error boundary, connection status. Styles use start and end from the first screen. Tests for each.

- **Early spike: Hermes `Intl` on the author's phone** (compact notation, `-u-nu-latn`, `ar-u-nu-latn` dates). jest-expo runs on Node, so it cannot answer this. If Hermes lacks something, the formatter gets a tested fallback.

**M3 — Features.** Stock list (paged, live, FlashList v2, with its recycling test in the matrix), stock detail with the chart (the three-candidate spike and its ADR first, then the chart, with the native text summary), watchlist with optimistic updates and rollback. Each feature with its matrix and tests.

**M4 — Polish.** All states, accessibility pass, Dynamic Type, reduced motion, haptics, safe areas, icon and splash, the runtime language switch for Arabic (`I18nManager`, `Updates.reloadAsync`, `LocaleProvider`) tested on the dev build and the APK, small and large screens on the emulator. Maestro flows for the main path.

**M5 — Distribution and documentation.** The Android APK from EAS internal distribution, with the API URL from EAS environment config; the README section for mobile (how to install the APK, how to run it locally, that iOS is source-only and untested), ADRs, `docs/ai` updated (the mobile prompts, lessons from this branch), the honesty statement in the author's words, screenshots. Then review against this plan; merge into `main` and tag `v1.1.0` only if the bar is met.

## 6. Scope protection

If time runs short, cut in this order: Maestro flows → haptics and pull to refresh → the in-app language switch (the layout still follows the device language and the cut is documented). Never cut: M0 keeping the web green, the React pin, the lint rules, tests for domain logic, lifecycle handling of the socket, accessibility labels and the chart text summary, the configuration error screen, the Android APK, and the honesty statement including that iOS is untested.

## 7. Configuration values

`EXPO_PUBLIC_API_URL` has no default. Where it comes from:

| Where it runs       | Value                                                                                                             |
| ------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Deployed API        | the Railway URL (see `docs/deployment.md`), with `https://`                                                       |
| Android emulator    | `http://10.0.2.2:3000` (the emulator's name for the host machine)                                                 |
| Phone on your Wi-Fi | `http://<your computer's LAN IP>:3000`; the server's `CORS_ORIGIN` is not involved (native apps are not browsers) |
| The APK             | the Railway URL, from EAS environment configuration, never from a file in git                                     |

All of these go in `apps/mobile/.env.example` with a comment each. Expo inlines only static `process.env.EXPO_PUBLIC_*` references at bundle time and needs a full reload to pick up a change. Cleartext `http://` is blocked on Android 9 and newer by default, so local development over `http://` needs the platform setting for debug builds only; the production API uses `https://`.

## 8. What is still unverified

Not settled by the docs read on 2026-11-25, and each has a place in the plan where it is settled:

- Metro and the compiled ESM `exports` of the shared packages (M1 spike).
- Hermes `Intl` features the formatters use (M2 spike on a real device).
- Whether `eslint-plugin-react-native` works with flat config on ESLint 9 (M1; local rules otherwise).
- jest-expo's `transformIgnorePatterns` for workspace packages that ship ESM (M1).
- Whether `victory-native` offers a candlestick chart, and how its Skia version requirement fits Expo's pinned Skia (M3 spike).
- Whether Zod can validate inside `app.config.ts` (M1; runtime validation is enough if not).
- Sources: Expo docs (SDK 58, monorepos, localization, environment variables, EAS and the review guide), Expo Router docs, TanStack Query's React Native page, FlashList v2 docs, the Socket.IO React Native guide, and each library's README, all read by helper agents on 2026-11-25 and re-checked by the author at M1 step 0.
