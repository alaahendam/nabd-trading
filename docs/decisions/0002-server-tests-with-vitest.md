# 0002. Test the server with Vitest, not Jest

- Status: accepted
- Date: 2026-11-24

## Context

`docs/PLAN.md` specified Jest for `apps/server`. NestJS 12 is published as ESM only (`type: module`) and its documentation now generates Vitest projects by default; Jest is documented only for the CommonJS option, which Nest 12 no longer offers. Nest relies on decorator metadata, which the test transformer has to emit.

## Decision

Use Vitest with an SWC transform (decorator metadata enabled) for unit and supertest e2e tests in `apps/server`. The web app already uses Vitest, so the whole repo has one runner, one coverage provider and one config style.

## Alternatives considered

- **Jest with ts-jest or @swc/jest in ESM mode.** Rejected: ESM support in Jest is still experimental, needs extra flags, and is no longer the documented path for Nest.
- **Pin Nest 11 to stay on CommonJS and Jest.** Rejected: starts the project on a superseded major.

## Consequences

- One test API (`vi`, `describe`, `it`) everywhere, shared coverage thresholds.
- `docs/PLAN.md` sections 5 and 6 are updated to say Vitest.
- Decorator metadata depends on the SWC plugin config. If a test fails with unresolved Nest dependencies, check that first.

## Amendments

- **2026-11-25, the mobile app.** `apps/mobile` will use jest-expo and React Native Testing Library, because the React Native tooling (the Expo preset, the transforms, the component testing library) is built on Jest. Vitest stays everywhere else: the server, the web app and every shared package. The shared fakes in `@nabd/testing` are plain recorders with no `vi.fn` or `jest.fn` inside, so they work under both runners, and the shared packages are tested by Vitest only. This is the one exception to "one runner, one coverage provider"; coverage thresholds are kept the same in both.
