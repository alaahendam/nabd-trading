# Nabd (نبض) — CLAUDE.md

Mini trading app built as a take-home for a Frontend Engineer role. It is code a team will keep building on, so quality, consistency and scalability matter even at this size. Full decisions and execution order live in `docs/PLAN.md` — read it before starting any phase.

Nabd is an independent project, not affiliated with or a copy of any real product. Market data is simulated and the UI says so.

## Working agreement

- Work phase by phase as listed in `docs/PLAN.md`. Finish a phase completely (code, tests, gates green), commit it, then stop and report before starting the next one.
- Never write app code before the repo, configs and gates of Phase 0 and 1 exist.
- Tests are part of the work, not a follow-up. For each module, write the test matrix in `docs/testing/<module>.md` first, then the code, then the tests. Do not move on until the matrix is fully covered.
- Never bypass a rule. Do not use `--no-verify`, `eslint-disable`, `@ts-ignore`, or lower a coverage threshold to make something pass. If a rule is wrong, stop and propose the change with a reason.
- If the plan and the request disagree, say so and ask before building.
- Explain decisions briefly in the commit body or an ADR (`docs/decisions/`), not in code comments.

## Stack

- Monorepo: pnpm workspaces + Turborepo
- `apps/web`: React + Vite + TypeScript (strict), Tailwind v4, TanStack Query, React Router, i18next, Lightweight Charts
- `apps/server`: NestJS, Socket.IO gateway, simulated market data
- `packages/shared`: Zod schemas and the types derived from them, socket event names. Single source of truth for contracts between web and server
- `packages/config`: shared tsconfig, ESLint, Prettier, Stylelint configs
- Package names: `@nabd/web`, `@nabd/server`, `@nabd/shared`, `@nabd/config`

## Architecture rules (enforced by ESLint, not by goodwill)

- Web imports flow one way: `app → features → shared/lib`. `shared` never imports from `features`.
- A feature never imports from another feature's internals. Each feature exposes a public `index.ts`.
- `socket.io-client` is imported only inside `features/market-data`. The HTTP client lives only in `lib/api`.
- Live prices live in an external store read with `useSyncExternalStore` and per-symbol selectors. They do not go through TanStack Query. One socket for the whole app, ref-counted subscriptions, updates batched per animation frame.
- Server modules talk to each other only through exported providers. Contracts come from `@nabd/shared`.
- No Redux. Server state is TanStack Query, live prices are the external store.
- Web files and folders are kebab-case, with no exceptions (`stock-row.tsx`, `price-store.ts`); a middle extension such as `.test` is fine. Tests sit next to the file they cover. A shared UI component gets its own folder with its test and an `index.ts`. Hooks live with their domain, not in a global `hooks/` folder. `app/` is grouped by role: `layout/`, `providers/`, `routes/`.

## Design system rules

- All visual values come from tokens in one place: primitives → semantic tokens. Dark and light swap the semantic layer only.
- Components use semantic utilities only. No arbitrary Tailwind values, no hex/rgb/hsl literals, no inline color styles outside the tokens file.
- Use logical properties only (`ms-`, `me-`, `ps-`, `pe-`, `start-`, `end-`), never `ml-`, `mr-`, `left-`, `right-`. The app is fully RTL-capable.
- Every user-facing string goes through i18n (English and Arabic). No literal strings in JSX. Digits are Latin in both languages. Charts and numbers stay LTR inside RTL layouts.
- Numbers that change use tabular numerals. Up and down are never conveyed by color alone.
- Every state is designed: loading skeleton, empty, error with retry, offline/reconnecting, stale price, 404. Respect `prefers-reduced-motion`.

## Quality gates

- Formatting: Prettier (with the Tailwind class-order plugin) and `.editorconfig`. LF line endings.
- Lint: ESLint flat config with `--max-warnings 0`, typescript-eslint strict-type-checked, jsx-a11y, hooks rules, boundaries.
- Git: pre-commit runs format and lint on staged files, commit-msg enforces Conventional Commits, pre-push runs typecheck and tests. CI repeats all of it, because hooks can be skipped and CI cannot.
- Coverage: 100% on domain logic (price simulator, history generator, watchlist service, realtime store, formatters), at least 90% overall. Bootstrap files such as `main.ts` are excluded explicitly with a reason.

## Commits

Conventional Commits (`feat:`, `fix:`, `chore:`, `test:`, `docs:`, `refactor:`), with a scope when it helps (`feat(server): ...`).

- One commit per feature or addition, scoped at the level of a whole piece of work, not per file or per rule. Everything that belongs to the same addition goes in together. Example: all the shared tooling configs (TypeScript, ESLint, Prettier, Stylelint) are one commit; the git hooks (husky, lint-staged, commitlint) are one commit; the CI workflow is one commit; a backend module with its tests is one commit.
- Split into its own commit only when a change is large, risky, or could cause problems later (for example a big dependency or toolchain upgrade, a data model change, a hard-to-revert refactor, or anything that is easier to revert on its own).
- A feature and its tests go in the same commit, so every commit leaves the repo green (lint, typecheck and tests pass at every commit).
- Never mix unrelated additions in one commit, and never batch a whole phase into a single commit. Stage files explicitly (`git add <paths>`), not `git add .`, and review `git diff --staged` before committing.
- Never commit generated files, secrets or local settings.

## Product notes

- Auth is out of scope. The identity layer uses an anonymous client ID (UUID in localStorage sent as a header). The server reads it through a `@CurrentUser()` decorator and a guard so a JWT guard can replace it without touching controllers.
- The watchlist is stored on the server per client ID, with optimistic updates and rollback on failure.
- Simulated data should behave like a real market: real tickers, realistic starting prices, per-stock volatility, a shared market factor, volatility clustering, irregular tick rates, consistent OHLC and previous close, deterministic seeded history that ends at the current price.

## Language

Code, comments, commit messages, docs and prompts are in English.
