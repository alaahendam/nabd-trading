# 0010. Pin React to the version the Expo SDK requires

- Status: accepted
- Date: 2026-11-25

## Context

The mobile app (`docs/MOBILE-PLAN.md`) lives in the same pnpm workspace as the web app and shares packages with it. Expo's monorepo guide says duplicate React versions in one app cause runtime errors, duplicate React Native versions are not supported, and recommends forcing a single React version from the root.

Expo SDK 58 pins `react` and `react-dom` at exactly 19.3.0 (in the `expo` package's bundled module versions, checked on the npm registry on 2026-11-25 for `expo@58.0.26`); React Native 0.88 asks for `react ^19.3.0`. The web app was on `^19.3.1`, so a workspace would have resolved two different patch versions, and the shared packages (which will use hooks) would have picked whichever copy their consumer provided.

## Decision

- The web app declares `react` and `react-dom` at exactly `19.3.0`: a patch downgrade from 19.3.1.
- The workspace has a root-level rule, `overrides` in `pnpm-workspace.yaml`, that resolves `react` and `react-dom` to 19.3.0 for every package, including dependencies that ask for a range. The lockfile contains one version of each.
- The shared packages declare `react` as a peer dependency, never as a dependency.
- `@types/react` stays on its caret range: it is types only, and React Native's peer range for it is wide.
- Moving to a new Expo SDK means changing the version in three places together: the override, the web app and the mobile app.

## Alternatives considered

- **Keep version ranges and let pnpm resolve them.** Rejected: it produces the duplicate Expo warns about the first time the ranges drift apart.
- **An override without the exact pin in the web app's `package.json`.** Rejected: the manifest would say one thing and the install do another.
- **Move mobile to React 19.3.1.** Not possible: Expo's SDK pins the version, and `expo-doctor` checks it.

## Consequences

- Web runs on 19.3.0 instead of 19.3.1. The downgrade was verified before this commit: format, lint, typecheck, all 1,051 unit and component tests, the build (no chunk warning) and all 38 end-to-end tests pass on it.
- Bundle sizes after the pin, which are the baseline for the shared-package extraction in M0: first load 586.6 kB raw and 181.9 kB gzip (react 313.9 / 98.8, data 163.8 / 47.3, i18n 55.6 / 18.1, app 52.6 / 17.3, runtime 0.7 / 0.4), plus the lazy chart chunk at 165.5 / 53.6.
- A dependency that needs a newer React than the pin has to wait for the next SDK, or the pin has to be reconsidered with a new ADR.
