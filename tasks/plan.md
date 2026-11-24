# Implementation Plan: Phase 6, integration and polish

Source: `docs/PLAN.md` section 6, Phase 6 (all states, a11y pass, responsive, reduced motion, Playwright E2E) and section 5 (the E2E flow). Working agreement: `CLAUDE.md`. The Phase 5 plan is fully checked off and kept in git history.

## Overview

Phases 4 and 5 proved each piece with component tests and a manual browser check. Phase 6 proves the whole app the way a user meets it: a real browser against the real server, automated. It also closes the gaps that only show up end to end: accessibility violations, narrow screens, reduced motion, and the 570 kB main bundle.

## Architecture decisions

- **E2E runs the real stack on its own ports.** Playwright starts the built server (port 3300) and the built web app (port 4273, built with `VITE_API_URL` pointing at the server). Ports differ from the dev defaults so a running dev server never collides, and `reuseExistingServer` stays off in CI only. Each test gets a fresh browser context, hence a fresh client ID and an empty watchlist, so tests do not share state and can run in parallel.
- **Live data is asserted by change, not by value.** The simulator is random per tick, so tests wait for a price to change (with a generous timeout) rather than expecting a number.
- **Accessibility is checked by axe in the browser,** on every page, in light and dark, in English and Arabic, with the WCAG 2.0, 2.1 and 2.2 A and AA tag sets. Violations are fixed in the product, never silenced. jsdom cannot judge contrast or layout, so this is the only place those are checked for real.
- **Responsive and reduced motion are asserted from computed styles and layout** (no horizontal overflow at 320 px, the flash animation is effectively off under `prefers-reduced-motion`), not by screenshots.
- **Code splitting by route.** Pages load with `React.lazy` behind the shell's existing Suspense and error boundary, so the main chunk shrinks and each page pays for itself.
- **CI gets an E2E job** (browser install, then the suite), separate from the fast verify job.

## Dependency graph

```
E2E harness (server + web on own ports)
  ├─ main flow spec
  ├─ states spec (error, offline, reduced motion, narrow screens)
  └─ a11y spec (axe)  ──> product fixes found by axe
route-level code splitting (independent)
CI job and docs (after the specs exist)
```

## Task list

- [ ] Task 1: E2E harness: real server and web on dedicated ports, health-checked, isolated per test
- [ ] Task 2: E2E main flow: live list, detail and chart, period switch, star, watchlist, reload, Arabic
- [ ] Task 3: E2E states: error and retry, offline and reconnect, reduced motion, 320 px layout
- [ ] Task 4: accessibility pass with axe across pages, themes and languages, fixing what it finds
- [ ] Task 5: route-level code splitting
- [ ] Task 6: CI E2E job, gates, README and ADR notes, final report

## Acceptance criteria (phase level)

- The E2E suite passes locally and is wired into CI; it starts and stops its own servers.
- axe reports no violations on any page in either theme or language.
- No horizontal overflow at 320 px on any page; the price flash is off under reduced motion.
- The main chunk is smaller than before and the production build warning is gone or explained.
- No lowered coverage thresholds, no lint or type escapes, no skipped tests.

## Risks and mitigations

| Risk                                             | Impact | Mitigation                                                                          |
| ------------------------------------------------ | ------ | ----------------------------------------------------------------------------------- |
| Flaky tests from random live data                | High   | Assert on change with long timeouts, never on exact values; no fixed sleeps         |
| E2E server start-up slow or racing the web build | Medium | Health-check URLs in `webServer`, builds done in the command before serving         |
| axe finds many issues late                       | Medium | Run it early (Task 4 right after the harness), fix as found, one commit per theme   |
| Chart canvas confuses axe                        | Medium | The chart is a labeled image; if axe objects, fix the semantics rather than exclude |
| Port collisions with the user's dev servers      | Low    | Dedicated ports 3300 and 4273, never 3000, 5173 or 4173                             |

## Open questions

- None blocking.
