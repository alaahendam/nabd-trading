# Nabd — Mini Trading App: Plan

Status: agreed decisions and execution order. Source of truth for `CLAUDE.md`, the ADRs and the README.

## 1. Locked decisions

| Area         | Decision                                                                                                                                                                                                                                                     |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| App name     | **Nabd (نبض)**. Repo `nabd-trading`; packages `@nabd/web`, `@nabd/server`, `@nabd/shared`, `@nabd/config`. Logo mark: a heartbeat line turning into a chart, lime on forest. Tagline: "Live markets, simulated"                                              |
| Platform     | Web only — React + Vite + TypeScript (strict)                                                                                                                                                                                                                |
| Repo         | Single monorepo — pnpm workspaces + Turborepo                                                                                                                                                                                                                |
| Layout       | `apps/web`, `apps/server` (NestJS), `packages/shared` (contracts), `packages/config` (shared tooling configs)                                                                                                                                                |
| Market data  | Realistic simulation only (no real provider). Visible "Simulated market data" badge. Real-world tickers, realistic starting prices (snapshot), per-stock volatility, market-wide factor, volatility clustering, irregular tick rates, OHLC/volume/prev close |
| Realtime     | Socket.IO (server gateway + client), rooms per symbol, batched ticks                                                                                                                                                                                         |
| Server state | TanStack Query                                                                                                                                                                                                                                               |
| Live prices  | External store + `useSyncExternalStore`, per-symbol selectors, rAF batching                                                                                                                                                                                  |
| Client state | No Redux — nothing left that needs it (documented in an ADR)                                                                                                                                                                                                 |
| Charts       | TradingView Lightweight Charts (verify attribution requirement of its license)                                                                                                                                                                               |
| Auth         | None. Anonymous client ID (UUID in localStorage → header). `@CurrentUser()` + guard so JWT can be swapped in later                                                                                                                                           |
| Watchlist    | Server-side per client ID, optimistic updates with rollback                                                                                                                                                                                                  |
| i18n         | English + Arabic, full RTL, Latin digits in both                                                                                                                                                                                                             |
| Theme        | Light + dark, defaults to system preference, user toggle persisted                                                                                                                                                                                           |
| Fonts        | IBM Plex Sans + IBM Plex Sans Arabic (designed as one family; tabular numerals for prices)                                                                                                                                                                   |
| Brand        | Inspired by Sarwa colors (forest #07351A, ink #0A140A, canvas #F8F9F9, sage #CFDACD, lime #C5FF94, amber #FFB932). Own name, no Sarwa logo. Market up/down colors kept distinct from brand green                                                             |
| AI docs      | `CLAUDE.md`, `.claude/` (commands, skills), `docs/ai/` (workflow + curated English prompts, marked as adapted), `docs/decisions/` (ADRs)                                                                                                                     |

## 2. Design direction — inspired, not copied, and sharper

- Product UI, not marketing UI: dense but calm information hierarchy; the price is always the loudest element on screen.
- Tabular numerals everywhere numbers change, so digits never jump.
- Every state is designed: loading (skeletons matching final layout), empty, error with retry, offline/reconnecting, stale price, 404.
- Motion with meaning only: short price flash on change, respects `prefers-reduced-motion`.
- Up/down conveyed by color AND sign/arrow (color-blind safe). WCAG AA contrast in both themes.
- Keyboard-first: visible focus ring, all actions reachable, star toggle is a real button with `aria-pressed`.
- Dark mode is a first-class design (green-tinted near-black, lime accent), not an inverted light theme.

## 3. Design system (single source of truth)

- `apps/web` tokens file: primitives (raw palette, spacing scale, radii, type scale, shadows, motion) → semantic tokens (`surface`, `surface-raised`, `text-primary`, `text-muted`, `border`, `brand`, `accent`, `positive`, `negative`, `watch`, `focus`…). Dark/light only swap the semantic layer. RTL handled by logical properties.
- Tailwind v4 `@theme` maps to semantic tokens only. Components use semantic utilities only.
- Base components in `shared/ui` with variants (`cva`): Button, IconButton, Card, Badge, Tabs, Skeleton, Toast, Tooltip, PriceText, ChangeBadge, ConnectionStatus.

## 4. Enforcement — the rules can't be bypassed by convention

Team agreement is encoded in tooling; a commit that breaks it is rejected.

Formatting (identical for everyone, on save and on commit)

- Prettier (shared config in `packages/config`) + `prettier-plugin-tailwindcss` for class order.
- `.editorconfig`, `.gitattributes` (LF line endings), `.nvmrc` + `engines` + `packageManager` pinned.
- `.vscode/settings.json` (format on save, ESLint fix on save) + `.vscode/extensions.json` recommendations.

Linting (shared flat config, `--max-warnings 0`)

- `typescript-eslint` strict-type-checked: no `any`, no non-null assertions, consistent type imports.
- Architecture: `eslint-plugin-boundaries` — `app → features → shared/lib` only; features never import another feature's internals (public `index.ts` only); `shared` never imports `features`.
- `no-restricted-imports`: `socket.io-client` only inside `features/market-data`; HTTP client only inside `lib/api`; no deep imports into `packages/shared`.
- Design system: Tailwind lint (`eslint-plugin-better-tailwindcss`) — no arbitrary values (`bg-[#…]`, `p-[13px]`), no unregistered classes, no physical direction classes (`ml-`, `mr-`, `left-`, `pl-`…) → must use logical (`ms-`, `me-`, `start-`, `ps-`…).
- `no-restricted-syntax`: no hex/rgb/hsl literals or inline `style` colors in TSX.
- Stylelint for CSS: color literals allowed only in the tokens file; logical properties enforced (`stylelint-use-logical`).
- i18n: `eslint-plugin-i18next` `no-literal-string` in JSX — no hardcoded user-facing text.
- React hooks rules, `jsx-a11y`, import sorting, unused imports removal.
- Server: same base config + module boundaries (no cross-module imports except via exported providers).

Git gates

- husky + lint-staged pre-commit: Prettier, ESLint, Stylelint on staged files.
- commit-msg: commitlint (Conventional Commits).
- pre-push: typecheck + tests.
- CI (GitHub Actions) repeats everything — hooks can be skipped with `--no-verify`, CI cannot. Pipeline: install (frozen lockfile) → format check → lint → typecheck → test with coverage thresholds → build.

## 5. Testing policy

- Every module gets a written test matrix (cases listed before the code) committed in `docs/testing/`.
- Coverage thresholds enforced in config (build fails below): 100% on domain logic (price simulator, history generator, watchlist service, realtime store/subscription manager, formatters); ≥90% global; bootstrap files (`main.ts`, module wiring) excluded explicitly.
- Server: Jest unit tests, Supertest integration for REST, Socket.IO client e2e for the gateway (subscribe/unsubscribe, rooms, batching, reconnect, invalid payloads).
- Shared: schema tests (valid/invalid payloads).
- Web: Vitest + Testing Library + MSW; realtime layer tested with a fake socket; component tests per state (loading/empty/error/offline/RTL/dark).
- E2E: Playwright on the main flows (list live update → open detail → switch periods → star → watchlist reflects it → reload persists → switch to Arabic).

## 6. Execution order (each phase = reviewed and committed before the next)

Phase 0 — Repository and workspace (no app code)

- git init, pnpm workspaces, Turborepo pipeline, Node/pnpm pinning, `.gitignore`, `.editorconfig`, `.gitattributes`, `.vscode/`.
- `packages/config`: tsconfig bases, ESLint flat configs (base/react/node), Prettier, Stylelint.
- husky, lint-staged, commitlint, CI workflow skeleton.
- `CLAUDE.md`, `.claude/`, `docs/` skeleton (ADR template, ai/, testing/), README skeleton.

Phase 1 — App shells with configs only

- `apps/server` Nest shell, `apps/web` Vite shell, Tailwind v4, Vitest/Jest/Playwright configs, env handling (validated).
- Gate: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` all green on empty shells; verify each lint rule fails on a deliberate violation.

Phase 2 — `packages/shared`

- Zod schemas → types: Stock, Quote, PriceTick, HistoryPoint, Period, WatchlistItem, API error shape; socket event names + payloads as typed constants; period config.
- Full tests.

Phase 3 — Backend (complete before any frontend feature)

- Market module: simulator (GBM, per-stock volatility, market factor correlation, volatility clustering, irregular tick frequency, cent rounding, OHLC/volume/prev close), deterministic seeded history ending at current price, day gaps.
- Stocks module (REST), Realtime module (gateway, rooms, batching, validation), Watchlist module (anonymous identity guard, `@CurrentUser()`), global validation pipe, error filter, CORS, health endpoint, optional chaos flags (latency/error rate).
- Test matrix → tests → coverage gate green.

Phase 4 — Frontend foundation

- Tokens + theme (light/dark/system), fonts, i18n + RTL, router, providers, error boundary, API client, query client, realtime layer (single socket, ref-counted subscriptions, external price store, rAF batching, reconnect/resubscribe, connection status, staleness).
- Tests.

Phase 5 — Features (each with tests): Stock list → Stock detail + chart → Watchlist.

Phase 6 — Integration and polish: all states, a11y pass, responsive, reduced motion, Playwright E2E.

Phase 7 — Documentation: README (run, architecture diagram, decisions and trade-offs, what's next, screenshots/GIF), ADRs finalized, `docs/ai/` workflow and prompts.

## 7. Scope protection

If time runs short, cut in this order: optional deploy → Playwright breadth (keep one core flow) → extra chaos flags. Never cut: tests for domain logic, enforcement rules, README decisions, Arabic/RTL, dark mode.

## 8. Open items

- Whether a deployed demo link is wanted (optional; Vercel does not support WebSockets, the server would need Render or Railway).
