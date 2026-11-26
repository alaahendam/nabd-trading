# Mobile M5: distribution and documentation

Part of `docs/MOBILE-PLAN.md` (section 5). Goal: a reviewer can install the Android app, and the repository says honestly how it was made and what is not verified. Merge into `main` and tag `v1.1.0` only if the bar in the plan is met.

## Who does what

Some of this cannot be done by the agent: it needs the author's Expo account, and the honesty statement must be in the author's own words.

- **Agent:** `eas.json`, the mobile section of the README, ADRs, the `docs/ai` updates, the matrix for the build setup, the review against the plan.
- **Author:** `eas login`, creating the EAS project and the environment variable, running the build, installing the APK on the phone and checking it, screenshots, and the statement in their own words.

## Tasks

- [x] **T1 Build configuration.** `apps/mobile/eas.json`: an internal APK profile whose API address comes from an EAS environment (BLD-01, BLD-02).
- [ ] **T2 The first APK.** The author logs in, creates the project and the variable, and builds; the author installs it and checks the icon, the splash, the language switch and the chart on the APK. Closes M4's T7 (ICN-02) and LNG-04 on a development-grade build.
- [x] **T3 README mobile section.** How to install the APK, how to run locally, that iOS is source-only and untested.
- [x] **T4 ADRs.** Decisions of this branch not yet written down.
- [ ] **T5 `docs/ai`.** The mobile prompts and the lessons from this branch.
- [ ] **T6 Honesty statement.** In the author's words; the agent only provides the facts.
- [ ] **T7 Screenshots.** From the APK.
- [ ] **T8 Review against the plan,** then merge and tag only if the bar is met.

## Unverified until the first build

- Whether `EXPO_PUBLIC_API_URL` from an EAS environment is inlined by an EAS build (the docs read say so for updates and hosting, and do not say it for builds). The first APK shows it: without the value the app shows its configuration error screen.
- The exact CLI command to create the variable (`eas env:set` in the docs read; `eas env:create --help` shows the current one).
