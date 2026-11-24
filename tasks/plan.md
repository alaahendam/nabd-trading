# Implementation Plan: Phase 1, app shells with configs only

Source: `docs/PLAN.md` section 6, Phase 1. Working agreement: `CLAUDE.md`.

## Overview

Create `apps/server` (NestJS) and `apps/web` (Vite + React) as empty but fully wired shells: build, lint, typecheck and test run green, test and Playwright configs exist, and environment variables are validated at startup. No product code. Phase 0 rules are verified against real files here (they were only proven with throwaway files before).

## Stack detected (versions from the npm registry on 2026-11-24)

- Node 24.13.0 (engines of every package below accept it), pnpm 12.23.0, TypeScript 6.0.3 (held, ADR 0001).
- Web: Vite 8, @vitejs/plugin-react 6, React 19, Tailwind 4.3 with `@tailwindcss/vite`, Vitest 5, Testing Library, jsdom, Playwright 1.65, Zod 4.
- Server: NestJS 12 (ESM only, `type: module`), @nestjs/config 12, Vitest 5 with SWC, supertest, Zod 4.

## Architecture decisions

- **Server tests use Vitest + SWC, not Jest.** Nest 12 is ESM-only and its docs default to Vitest. One runner across the repo. Plan and ADR 0002 updated (user decision).
- **Env is validated with Zod in both apps.** The server passes the schema to `ConfigModule.forRoot({ validationSchema })` (documented Standard Schema support). The web parses `import.meta.env` through the same pattern in `lib/env.ts`. The app refuses to start on invalid env.
- **No scaffolder.** `create-vite` and `nest new` bring their own git, ESLint, Prettier and test configs that fight `@nabd/config`. Files are written by hand from the official docs and the shared configs are used as is.
- **Playwright is configured but not run in Phase 1.** Browsers are a large download that needs approval. `test:e2e` is separate from `pnpm test`.
- **Per-glob 100% coverage thresholds** for domain logic are added in the phase that creates that code. Phase 1 enforces the 90% global floor only.

## Task list

### Slice 1: Server shell (risk first: ESM Nest + decorators + tests)

- [x] Task 1: `apps/server` boots, validates env, and its test runner works
  - Acceptance: `@nabd/server` package (ESM); `AppModule` with global `ConfigModule` validated by a Zod schema; `main.ts` reads `PORT` and `CORS_ORIGIN`; invalid env fails startup; test matrix `docs/testing/server-env.md` written first.
  - Verify: `pnpm --filter @nabd/server lint typecheck test build`; start the built app and see HTTP 404 on `/` (listening, no routes yet).
  - Files: `package.json`, `tsconfig.json`, `nest-cli.json`, `vitest.config.ts`, `eslint.config.js`, `src/main.ts`, `src/app.module.ts`, `src/config/env.ts` (+ tests), `test/app.e2e.test.ts`.
  - Scope: M

### Checkpoint: Server

- [x] Gates green for `@nabd/server`, committed.

### Slice 2: Web shell

- [x] Task 2: `apps/web` renders an empty app shell with validated env
  - Acceptance: `@nabd/web` package; Vite + React + strict TS; `src/{app,features,shared,lib}` layout; `lib/env.ts` parses `VITE_API_URL`; `App` test passes; matrix `docs/testing/web-env.md` first.
  - Verify: `pnpm --filter @nabd/web lint typecheck test build`.
  - Files: `package.json`, `index.html`, `vite.config.ts`, `tsconfig.json`, `eslint.config.js`, `vitest.config.ts`, `src/main.tsx`, `src/app/App.tsx`, `src/lib/env.ts` (+ tests), `src/test/setup.ts`.
  - Scope: M
- [x] Task 3: Tailwind v4 wired and the Tailwind lint rules active
  - Acceptance: `@tailwindcss/vite`, `src/styles/index.css` with `@import "tailwindcss"`; ESLint `better-tailwindcss` entry point set; Prettier `tailwindStylesheet` set; a deliberate `ml-4` / `p-[13px]` / unknown class in a throwaway file is rejected.
  - Files: `vite.config.ts`, `src/styles/index.css`, `eslint.config.js`, `prettier.config.js`.
  - Scope: S
- [x] Task 4: Playwright config and one smoke spec
  - Acceptance: `playwright.config.ts` with `webServer` and `baseURL`; `e2e/smoke.spec.ts`; Vitest excludes `e2e/`; typechecks and lints. Not executed (browser download needs approval).
  - Files: `playwright.config.ts`, `e2e/smoke.spec.ts`, `vitest.config.ts`.
  - Scope: S

### Checkpoint: Web

- [x] Gates green for `@nabd/web`, committed.

### Slice 3: Phase gate

- [x] Task 5: Whole-repo gates and rule proofs against real files
  - Acceptance: `pnpm install --frozen-lockfile`, `format:check`, `lint`, `typecheck`, `test`, `build` all green; every Phase 0 rule that was deferred (`no-unknown-classes`, entry points, `lint-staged` per workspace, hex/arbitrary/physical/i18n/boundaries) rejected a throwaway violation inside the real apps; README and `docs/PLAN.md` updated.
  - Scope: S

## Risks and mitigations

| Risk                                                      | Impact | Mitigation                                                                 |
| --------------------------------------------------------- | ------ | -------------------------------------------------------------------------- |
| Nest 12 ESM + decorator metadata under Vitest             | High   | Slice 1 first; SWC plugin emits metadata; e2e boot test proves DI works    |
| NodeNext needs `.js` import suffixes, boundaries resolver | Med    | Typescript resolver already configured; proven by a cross-module violation |
| Plugin peers drift (Vite 8, Vitest 5, React 19)           | Med    | `pnpm peers check` after each install; hold versions in ADR 0001 if needed |
| Playwright cannot be run without a browser download       | Low    | Config typechecks and lints; run is deferred and reported                  |

## Open questions

- None blocking. Playwright browser install (about 150 MB) needs your approval before the first e2e run.
