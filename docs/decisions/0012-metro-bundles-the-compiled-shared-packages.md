# 0012. Metro bundles the compiled shared packages as they are

- Status: accepted
- Date: 2026-11-25

## Context

ADR 0011 ships the shared packages as compiled ESM with an `exports` map and left one question open for the first mobile milestone: does Metro resolve them under pnpm's isolated installs, where each package only sees its own declared dependencies and the workspace packages are symlinks? If not, the choices were a Metro configuration, `nodeLinker: hoisted` for the whole repository, or shipping source instead of compiled output.

## The spike

`apps/mobile` declared all seven packages as `workspace:*` dependencies. A temporary route imported one export from each (`createApi` and `ApiClientError`, `createQueryClient`, `applyLivePrice`, `createI18n`, `PriceStore` and `RealtimeClient`, `API_PREFIX`, `contrastRatio`). The app was exported with `expo export --platform android --no-bytecode --no-minify` so function names survive, and the bundle was searched for each one. The route was removed afterwards.

| Check                                                              | Result                                                                                                                                                                                   |
| ------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Export finishes                                                    | yes, 1374 modules, no resolution errors                                                                                                                                                  |
| Each package's code is in the bundle                               | all seven found (`createApi`, `ApiClientError`, `createQueryClient` as `query-client.js`, `applyLivePrice`, `PriceStore`, `RealtimeClient`, `contrastRatio`, `API_PREFIX`, `createI18n`) |
| Dependencies of the packages that the app does not declare resolve | yes: `socket.io-client` (behind `@nabd/market-data`) and `@tanstack/query-core` (behind `@nabd/data`) are in the bundle                                                                  |
| `.js` extensions in the compiled imports (`./query-client.js`)     | resolved                                                                                                                                                                                 |
| Jest (jest-expo) loads every package (`PKG-01`)                    | yes, once `standard-navigation` was added to `transformIgnorePatterns` (an Expo Router dependency, unrelated to our packages)                                                            |

## Decision

No Metro configuration, no `nodeLinker: hoisted`, and no source packages: Expo SDK 58's default Metro resolves the compiled packages through their `exports` maps under pnpm isolated installs. The repository keeps one install mode and one way to ship a package.

The guard is already in the pipeline: `PKG-01` loads every package under Jest, and the CI `expo export` step fails the build if Metro stops resolving any package the app imports (the app imports them for real from M2 on).

## Consequences

- A new shared package only needs `workspace:*` in `apps/mobile/package.json` and a turbo build before the app builds.
- Metro's resolution is checked by the export step, not assumed. If a future Metro or Expo version breaks it, that step fails first.
- `@nabd/market-data` and `@nabd/data` keep `react` and TanStack Query as peer dependencies; the app declares them, so there is a single copy (React is pinned by ADR 0010).

## Alternatives considered

- **`nodeLinker: hoisted`.** Not needed, and it would loosen the isolation that stops the packages using undeclared dependencies.
- **A custom `metro.config.js` with `watchFolders` and `extraNodeModules`.** Not needed: the default configuration for monorepos in SDK 58 handles the symlinks.
- **Shipping TypeScript source.** Not needed for the same reason, and it would give the web and the mobile app two ways to consume a package.
