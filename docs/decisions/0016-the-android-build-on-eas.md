# 0016. How the Android APK is built on EAS

- Status: accepted
- Date: 2026-11-26

## Context

The reviewer route is an installable Android APK from EAS internal distribution (`docs/MOBILE-PLAN.md`), built on Expo's servers from this monorepo. Three facts about that build shaped the setup, and the first two were found by a failed build.

## Decision

- **`apps/mobile/eas.json` has one profile, `preview`:** internal distribution, `android.buildType: apk`, and `environment: preview`. The API address comes from an EAS environment variable (`EXPO_PUBLIC_API_URL`, plain text because it is not a secret), never from a file in git; a test checks that `eas.json` holds no address (BLD-01, BLD-02).
- **`app.config.ts` imports no workspace package.** The server reads the config before it builds any package, and the compiled packages are not in git, so importing `@nabd/tokens` there failed the first build in its "Read app config" phase. The brand color is now a JSON copy, and a test fails if it differs from the token (BLD-06). The log said only that `expo config` exited with an error, so the cause is the best explanation and was not reproduced with the old config.
- **`eas-build-post-install` builds the shared packages and the chart library.** The server bundles with Gradle and runs none of the package scripts, so nothing else would compile `@nabd/*` or generate `chart-library.ts` (ADR 0013). A test pins the order (BLD-07). The second build, which had both fixes, finished.
- **The EAS project ID is in `app.config.ts`** (`extra.eas.projectId`). It is an identifier, not a secret, and `eas init` cannot write into a code config.

## Alternatives considered

- **Hardcode the API address in `eas.json` (`env`).** Simple, and wrong: it would put the deployed address in git, which the plan rules out.
- **Commit the built packages.** Removes the hook and puts generated output under version control.
- **Switch the config to JSON.** It could not hold the computed values, and the splash and icon colors would still be copies.

## Consequences

- A change to the brand token needs the JSON copy changed too; the test says so rather than letting the splash drift.
- A build is slow and counted: the free plan limits builds, so an APK is built on purpose, not per commit. CI still checks the Android export on every push (ADR 0012), which does not catch problems that only exist on the build server.
- Not verified: iOS, and whether an EAS build would also inline a variable that is not in the `preview` environment.
