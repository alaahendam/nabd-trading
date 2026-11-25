# Mobile M2: foundation

Part of `docs/MOBILE-PLAN.md` (section 5). Goal: everything a screen needs around it, with no feature screens yet: the theme, the language, storage, fonts, the splash hold, the query client, the realtime layer with the app lifecycle, the connection status, the error boundary, and the navigation with the detail stack. Styles use `start` and `end` from the first line (the local lint rule enforces it).

## Decisions for this phase

- **Storage is read once, before the first render.** `ClientIdStorage` and the stores are synchronous, AsyncStorage is not. A `StartupStorage` reads the three keys (client ID, theme, language) in one `multiGet` while the splash screen is held, then answers synchronously and writes through. A read that fails starts the app with empty values; a write that fails is ignored for the session. This is the plan's "splash held until theme and language have been read" decision, with the client ID added because the API client needs it synchronously.
- **Network state: `expo-network`** (pinned by the SDK), adapted to the shared `Connectivity` port. It feeds both `onlineManager` (TanStack Query) and the realtime client.
- **Focus: `AppState`** feeds TanStack Query's `focusManager`: the app is "focused" while `active`.
- **Lifecycle: the socket closes in the background and opens again on return.** `RealtimeClient.disconnect()` sets the status to `offline`, so every price is stale (the shared `freshness` rule) until a fresh tick arrives after reconnecting.
- **Language in M2 is read from storage and defaults to English**, with no device detection and no switch: showing Arabic text in a left-to-right layout would be wrong before the RTL work of M4. The stored value is read now so M4 only adds the switch.
- **Fonts: IBM Plex Sans and IBM Plex Sans Arabic** from `@expo-google-fonts/*` (the Expo-documented way), loaded with `expo-font` during the splash hold. Regular and semibold weights, as on web.
- **Theme:** preference `light | dark | system`, persisted; `system` follows `Appearance`. Colors come from `resolveToken` of the resolved theme. The static `theme.ts` of M1 becomes a function of the resolved theme.
- **Hermes `Intl` spike:** it needs the author's phone (Jest runs on Node). A temporary diagnostic route is built and run; its result decides whether the formatters need a fallback. It is not committed as a feature.

## Tasks

- [x] **T1 Test matrix.** `docs/testing/mobile-foundation.md`, before the code.
- [x] **T2 Storage and bootstrap.** `StartupStorage`, the client ID on top of it, fonts, the splash hold (`Bootstrap`).
- [x] **T3 Theme and language.** Theme store and provider, themed `Text` and `Screen`, language read.
- [x] **T4 Data and realtime.** Query client wired to `AppState` and the network, the API, the realtime client and provider, the lifecycle handling.
- [ ] **T5 Shell UI.** Connection status, error boundary, the stock detail route in a stack above the tabs, tab titles and the simulated-data notice.
- [ ] **T6 Hermes `Intl` spike.** Diagnostic route, run on the phone, result recorded.
- [ ] **T7 Gates.** Whole-repo gates, CI green on the PR, plan ticked.

## Gate

Lint, typecheck, test and build green for the repository and the mobile app; every state of the foundation tested; no physical direction anywhere; CI green on the PR.
