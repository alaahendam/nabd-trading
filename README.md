# Nabd (نبض)

Live markets, simulated. A small trading app: live stock list over WebSockets, stock detail with historical charts, and a watchlist.

> Nabd is an independent take-home project. It is not affiliated with any company, and all market data is simulated.

**Status:** Phases 0 to 2 complete: workspace tooling, quality gates, empty but fully wired app shells (server and web) with validated environment variables, and the shared contracts package (`@nabd/shared`). There is no product code yet. This README is a skeleton and is completed in the final documentation phase.

## Requirements

- Node 24.13.0 (see `.nvmrc`)
- pnpm 12.23.0 (pinned in `packageManager`; `corepack enable` provides it)

## Get started

```sh
pnpm install
```

| Script              | What it does                                                        |
| ------------------- | ------------------------------------------------------------------- |
| `pnpm dev`          | Run every workspace's dev server (Turborepo)                        |
| `pnpm build`        | Build every workspace                                               |
| `pnpm lint`         | ESLint in each workspace, root tooling files, and Stylelint for CSS |
| `pnpm typecheck`    | TypeScript in each workspace                                        |
| `pnpm test`         | Vitest with coverage thresholds in each workspace                   |
| `pnpm test:e2e`     | Playwright (needs `pnpm exec playwright install chromium` once)     |
| `pnpm format`       | Prettier write                                                      |
| `pnpm format:check` | Prettier check                                                      |

## Repository layout

```
apps/web          React + Vite + Tailwind v4 shell (port 5173)
apps/server       NestJS shell (port 3000)
packages/shared   Zod contracts, routes, errors, socket events (compiled ESM)
packages/config   Shared tsconfig, ESLint, Prettier and Stylelint configs
docs/             PLAN.md, ADRs, test matrices, AI workflow
```

## How the rules are enforced

Rules live in tooling, so a change that breaks them is rejected rather than reviewed.

- **Editor:** `.editorconfig`, `.vscode/` (format and fix on save).
- **Pre-commit:** Prettier, ESLint (`--max-warnings 0`) and Stylelint on staged files.
- **commit-msg:** Conventional Commits (commitlint).
- **Pre-push:** typecheck and tests.
- **CI:** the same gates again, because hooks can be skipped and CI cannot.

The ESLint configs in `packages/config` encode the architecture (`app → features → shared/lib`, public `index.ts` per feature, network access only in `features/market-data` and `lib/api`), the design system (tokens only, logical properties only, no arbitrary values or color literals) and i18n (no literal strings in JSX). Inline `eslint-disable` comments are ignored.

## Planned sections

- Run it (dev, test, end to end)
- Architecture (diagram)
- Decisions and trade-offs (see `docs/decisions/`)
- How I worked with AI (see `docs/ai/`)
- What I would do next
- Screenshots

## Environment

Both apps validate their environment with Zod at startup and refuse to run on invalid values. Every variable has a default, so `pnpm dev` works with no setup. See `apps/server/.env.example` and `apps/web/.env.example`.
