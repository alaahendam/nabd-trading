# Implementation Plan: Phase 4, frontend foundation

Source: `docs/PLAN.md` section 6, Phase 4. Working agreement: `CLAUDE.md`. Earlier phase plans are fully checked off and kept in git history. Decisions: ADR 0005 (no Redux, live prices in an external store), ADR 0006 (design tokens and theming).

## Overview

Everything the features of Phase 5 stand on, with no product screens yet: the realtime layer (one socket, reference-counted subscriptions, an external price store with per-frame batching, reconnect and resubscribe, connection status, staleness), design tokens with light, dark and system themes, fonts, English and Arabic with RTL and Latin digits, formatters, the API and query clients, the provider tree, the router, an error boundary, and a minimal app shell (header, theme and language toggles, connection indicator, "simulated market data" badge) so the foundation can be seen and verified in a browser. Pages are placeholders.

## Stack (installed versions)

React 19.3, React Router 8 (`react-router`, `RouterProvider` from `react-router/dom`), TanStack Query 5, i18next 27 with react-i18next 18, socket.io-client 4.8, Tailwind 4.3, Fontsource IBM Plex Sans and IBM Plex Sans Arabic, class-variance-authority, clsx, tailwind-merge. Tests: Vitest, Testing Library, user-event, MSW.

## Interface design and quality rules

- **Realtime is isolated.** Only `features/market-data` imports `socket.io-client` (lint-enforced). It exposes hooks and a provider through its `index.ts`.
- **Everything from the network is untrusted.** REST responses and socket payloads are parsed with the shared schemas before use; invalid data is dropped or raises an `ApiClientError`.
- **Injection over globals.** The API client, the socket, the clock and the frame scheduler are injected, so tests need no real network, timers or animation frames.
- **Design system.** Semantic tokens only; logical properties only; no literals in JSX; every user-facing string through i18n in English and Arabic; digits Latin in both languages; numbers LTR inside RTL layouts; tabular numerals for numbers that change.
- **Accessibility.** Landmarks and a skip link, visible focus ring from a token, theme choice as a labeled group with `aria-pressed`, connection status in a polite live region, `prefers-reduced-motion` respected, up and down never conveyed by color alone.
- **Every state designed.** The shell has loading (route fallback), error (boundary with retry), offline and reconnecting (connection indicator) and 404.

## Task list

### Slice 1: Realtime layer (highest risk, pure logic first)

- [ ] Task 1: `PriceStore` and staleness
  - Acceptance: coalesces ticks per symbol, publishes once per scheduled frame; older or equal timestamps ignored; per-symbol subscribers notified only for their symbol; snapshots stable until a change; previous price kept for direction; staleness is a pure function of time, connection and last receipt; matrix `docs/testing/web-realtime.md` first; 100% coverage.
  - Scope: M
- [ ] Task 2: `RealtimeClient`, connection status, socket adapter
  - Acceptance: one socket; `acquire` is reference-counted and idempotent to release; subscribe only when connected, resubscribe all active symbols on every `connect`, in chunks of 50; payloads validated with `ticksPayloadSchema`; status `connecting`, `connected`, `reconnecting`, `offline`; `server:error` reported; the only file importing `socket.io-client` wraps it; 100% coverage.
  - Scope: L, two commits (client and status, then the adapter)
- [ ] Task 3: React bindings
  - Acceptance: `RealtimeProvider`, `useLivePrice`, `useConnectionStatus`, `useSubscription`, `useIsStale`; StrictMode safe (connect, disconnect, connect); a component re-renders only for its symbol.
  - Scope: M

### Checkpoint: Realtime

- [ ] Gates green, committed.

### Slice 2: Look and feel

- [ ] Task 4: tokens, theme and Tailwind mapping
  - Acceptance: `tokens.css` (primitives, light and dark semantic layers), `@theme inline` mapping with the default palette removed, `dark` custom variant on `data-theme`, theme store (`light`, `dark`, `system`, persisted, follows system), pre-paint script, contrast test over every UI pairing in both themes.
  - Scope: M
- [ ] Task 5: fonts and base styles
  - Acceptance: IBM Plex Sans and IBM Plex Sans Arabic via Fontsource, font stack token, tabular numerals utility use, focus ring from token, reduced motion respected.
  - Scope: S

### Slice 3: Language

- [ ] Task 6: i18n and RTL
  - Acceptance: typed English and Arabic resources, language detection (stored, then browser, then English), persistence, `lang` and `dir` on `<html>` kept in sync, plural forms for Arabic, no missing keys between languages (tested).
  - Scope: M
- [ ] Task 7: formatters
  - Acceptance: price, signed change, percent, compact volume, direction, in both languages with Latin digits; 100% coverage.
  - Scope: S

### Slice 4: Data access

- [ ] Task 8: API client, client ID and endpoints
  - Acceptance: parses every response with the shared schemas; adds `x-client-id`; maps failures to `ApiClientError` (`network`, `http`, `parse`) with the server's code; 204 handled; abort supported; tested with MSW; 100% coverage.
  - Scope: M
- [ ] Task 9: query client and API provider
  - Acceptance: retries only network and 5xx errors with backoff, never 4xx; sensible stale times; fresh client per test.
  - Scope: S

### Checkpoint: Foundations

- [ ] Gates green, committed.

### Slice 5: The app

- [ ] Task 10: shared UI atoms
  - Acceptance: `Button` (cva variants), `Badge`, `ConnectionStatus` (presentational), icons, `cn`; keyboard and name checks.
  - Scope: M
- [ ] Task 11: providers, router, error boundary, shell, placeholder pages
  - Acceptance: provider tree; routes `/`, `/stocks/:symbol`, `/watchlist`, catch-all 404; skip link, landmarks, nav with `aria-current`; theme and language toggles; connection indicator and simulated-data badge; error boundary with retry and a router error element; the existing `App` test updated.
  - Scope: L, split into two commits

### Checkpoint: Complete

- [ ] Task 12: browser verification and gates
  - Acceptance: the built app against the running server in a real browser: live connection indicator, dark theme, Arabic with RTL, 404, reload keeps preferences, no console errors, mobile width; whole-repo gates; every deferred rule re-checked (`no-literal-string` in JSX, Tailwind rules against the real theme, boundaries, `socket.io-client` restriction); README and docs.
  - Scope: M

## Risks and mitigations

| Risk                                                               | Impact | Mitigation                                                                            |
| ------------------------------------------------------------------ | ------ | ------------------------------------------------------------------------------------- |
| Re-render storms from live ticks                                   | High   | Coalesce per symbol, flush once per frame, per-symbol subscriptions, stable snapshots |
| Missed resubscribe after a reconnect (server rooms are per socket) | High   | Re-emit all active subscriptions on every `connect`; tested with a fake socket        |
| Tokens that fail WCAG contrast in one theme                        | High   | Contrast test over the real `tokens.css`, both themes                                 |
| React Router 8 and MSW 3 differ from what I know                   | Med    | Verify the installed APIs by typecheck and tests before building on them              |
| Stripped Tailwind palette breaks a needed utility                  | Med    | Map every needed token; the unknown-class lint rule reports gaps immediately          |
| Arabic strings are mine, not a native speaker's                    | Med    | Say so in the report; keys and structure are ready for review                         |
| Fonts and RTL cannot be verified by unit tests                     | Med    | Real browser check in Task 12                                                         |

## Open questions

- None blocking. Arabic copy should be reviewed by a native speaker before release.
