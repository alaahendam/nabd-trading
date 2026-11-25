# Nabd Mobile — Plan

Status: agreed scope, architecture and execution order for the mobile app. Lives on the `feat/mobile` branch. `docs/PLAN.md` and `CLAUDE.md` still apply in full; this file adds what is specific to mobile. Where they disagree, stop and ask.

## 0. Context and honesty

The take-home is assessed on the web app, which is where the author's experience is, so the web app and the server were built first and released as `v1.0.0`. React Native is outside the author's experience. With time left, the mobile app was added as an AI-led ("vibe-coded") extension: the agent leads the native details, and the app is held to the same architecture, lint rules, tests and CI as the web app. The author reviews behaviour, structure and every diff, not every native detail. This is stated in the README and in `docs/ai`, in the author's words, when the branch is finished.

The branch is merged into `main` (and tagged `v1.1.0`) only if it reaches the same bar as the web app. If it does not, it stays a documented experimental branch.

## 1. Locked decisions

| Area          | Decision                                                                                                                                                                                                                                                                                                     |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| App           | `apps/mobile`, package `@nabd/mobile`, Expo (latest stable SDK, checked against the Expo docs at the start of M1), TypeScript strict, new architecture, Hermes                                                                                                                                               |
| Identity      | Same as web: name Nabd, IBM Plex Sans and IBM Plex Sans Arabic, the same palette and semantic tokens, light, dark and system themes, the same copy in English and Arabic, the "simulated data" notice on every screen                                                                                        |
| Navigation    | Expo Router (file-based, built on React Navigation). Stack for detail, tabs for Markets and Watchlist. Typed routes                                                                                                                                                                                          |
| Server state  | TanStack Query, wired to React Native: `focusManager` on `AppState`, `onlineManager` on NetInfo                                                                                                                                                                                                              |
| Live prices   | The same `PriceStore` and `RealtimeClient` as web, moved to a shared package. One socket for the app, ref-counted subscriptions, per-frame batching, read with `useSyncExternalStore` per symbol                                                                                                             |
| App lifecycle | The socket disconnects when the app goes to the background and reconnects and resubscribes when it comes back. Prices from before the pause are marked stale until a fresh tick arrives                                                                                                                      |
| Lists         | FlashList for the stock list and watchlist; rows re-render only for their own symbol                                                                                                                                                                                                                         |
| Styling       | `StyleSheet` with a typed theme from the shared tokens (no hard-coded values). No styling library unless the M1 review shows a clear need; if one is added, it gets an ADR                                                                                                                                   |
| Chart         | Decided by a spike in M3 between a native Skia-based chart library and a WebView running the web's Lightweight Charts. Measured on the same data (frame rate while ticking, period switch time, bundle size, accessibility, look), decided in an ADR. The chart stays behind the same kind of port as on web |
| Storage       | Client ID, theme and language persisted with a small storage adapter (AsyncStorage or MMKV, chosen in M2). The client ID is not a secret                                                                                                                                                                     |
| Config        | `EXPO_PUBLIC_API_URL`, validated with Zod in `app.config.ts` and at runtime, same defaults approach as web                                                                                                                                                                                                   |
| i18n          | Same resources as web (moved to a shared package). Arabic switches the layout to RTL through `I18nManager` and reloads the app, done in M4                                                                                                                                                                   |
| Testing       | jest-expo and React Native Testing Library for logic and components, with the shared fakes (socket, API). The shared packages keep their Vitest suites. Coverage thresholds as on web: 100% on domain logic, 90% overall. Maestro flows for the main path, run locally and documented                        |
| Distribution  | A way for a reviewer to open the app on a phone without building it: an EAS Update link for Expo Go, and an Android APK from an EAS build. Chosen and documented in M5                                                                                                                                       |

## 2. Shared code (M0)

Code that is not tied to the DOM or to React Native moves out of `apps/web` into packages, so both apps use one implementation:

| Package             | Contents                                                                                                                                                                                                   |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@nabd/market-data` | `PriceStore`, `RealtimeClient`, subscription ref-counting, staleness, connection status. Platform hooks injected (scheduler for frame batching, online/offline and lifecycle signals)                      |
| `@nabd/api-client`  | The fetch-based API client with Zod validation of every response, error mapping, the client ID header                                                                                                      |
| `@nabd/i18n`        | Translation resources and their typed keys, and the formatters (prices, percentages, dates, `ar-u-nu-latn`)                                                                                                |
| `@nabd/tokens`      | Design tokens as typed TypeScript values: primitives and the semantic layer for light and dark. The web's tokens CSS is generated from them by a script, and CI fails if the generated file is out of date |

Rules for M0:

- The web app's behaviour does not change. Every web unit, component and E2E test stays green, coverage stays at its thresholds, and the bundle size is measured before and after.
- Each extraction is its own commit, because each one is a refactor of finished code and should be easy to revert.
- ESLint boundaries are updated so the new packages cannot import from apps, React DOM or React Native.
- ADR: why these packages and why now.

## 3. Mobile architecture

```
apps/mobile
  app/                  Expo Router routes only (thin): (tabs)/index, (tabs)/watchlist, stock/[symbol], +not-found
  src/app               providers (query client, theme, i18n, realtime), lifecycle wiring, error boundary
  src/features          stocks (list, detail, chart), watchlist, market-data (the only socket wiring)
  src/lib               api, storage, env, theme, i18n setup
  src/shared/ui         small components: Text, Button, IconButton, Card, Badge, Tabs, Skeleton, PriceText, ChangeBadge, ConnectionStatus, Screen
  src/test              harness: fake socket, fake API, providers
```

The same rules as web, enforced by ESLint:

- Imports flow `app → features → shared/lib`; features expose a public `index.ts`; route files only compose features.
- `socket.io-client` only in `features/market-data`; network only through `@nabd/api-client`.
- React Native rules: no inline styles, no color literals, no raw text outside the `Text` component, every visible string through i18n, `accessibilityRole` and `accessibilityLabel` on interactive elements.
- Theme values only from the typed theme; spacing, radii and type sizes come from tokens.

## 4. Mobile quality bar

- Every state designed: loading skeletons, empty, error with retry, offline and reconnecting, stale price, unknown symbol.
- Accessibility: roles and labels on every control, the star is a toggle with its state announced, Dynamic Type respected (layouts tested at large font scale), reduce motion respected, live prices never announced on every tick, touch targets at least 44 points.
- Safe areas, keyboard handling, pull to refresh on lists, haptic feedback on the star.
- App icon and splash screen with the Nabd mark.
- No sideways overflow on small phones; tested on a small and a large screen size.

## 5. Execution order (each phase is reviewed and committed before the next)

**M0 — Shared core.** Extract `@nabd/market-data`, `@nabd/api-client`, `@nabd/i18n`, `@nabd/tokens` as in section 2. Test matrices for any moved module that gains platform hooks. Gate: web fully green, E2E included, coverage and bundle size unchanged or explained.

**M1 — Expo shell and tooling.** Create `apps/mobile` with the Expo template that fits, then bring it under the repo's TypeScript, ESLint (plus React Native rules), Prettier and commit rules. jest-expo, env validation, a CI job (lint, typecheck, test, `expo-doctor`, an export build). Gate: lint, typecheck, test, build green on the empty app, and each new mobile lint rule shown to fail on a deliberate violation.

**M2 — Foundation.** Theme from `@nabd/tokens` (light, dark, system, persisted), fonts, Expo Router with tabs and the detail stack, query client wired to AppState and NetInfo, the realtime layer with lifecycle handling, storage adapter, i18n in English, error boundary, connection status. Tests for each.

**M3 — Features.** Stock list (paged, live, FlashList), stock detail with the chart (spike and ADR first), watchlist with optimistic updates and rollback. Each feature with its matrix and tests.

**M4 — Polish.** All states, accessibility pass, Dynamic Type, reduced motion, haptics, safe areas, icon and splash, Arabic with RTL and the reload flow, small and large screens. Maestro flows for the main path.

**M5 — Distribution and documentation.** EAS Update link and Android APK, README section for mobile (how to open it on a phone, how to run it locally), ADRs, `docs/ai` updated (the mobile prompts, lessons from this branch), the honesty statement in the author's words, screenshots. Then review against this plan; merge into `main` and tag `v1.1.0` only if the bar is met.

## 6. Scope protection

If time runs short, cut in this order: Maestro flows → APK (keep the Expo Go link) → Arabic and RTL on mobile (documented as next step) → haptics and pull to refresh. Never cut: M0 keeping the web green, the lint rules, tests for domain logic, lifecycle handling of the socket, accessibility labels, the honesty statement.
