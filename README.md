# Nabd (نبض)

Live markets, simulated. A small trading app: live stock list over WebSockets, stock detail with historical charts, and a watchlist.

> Nabd is an independent take-home project. It is not affiliated with any company, and all market data is simulated.

**Status:** Phase 0 complete: repository, workspace tooling and quality gates. There is no application code yet; the app shells arrive in Phase 1. This README is a skeleton and is completed in the final documentation phase.

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
| `pnpm test`         | Tests in each workspace                                             |
| `pnpm format`       | Prettier write                                                      |
| `pnpm format:check` | Prettier check                                                      |

## Repository layout

```
apps/web          React + Vite shell            (Phase 1)
apps/server       NestJS shell                  (Phase 1)
packages/shared   Zod contracts, socket events  (Phase 2)
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
