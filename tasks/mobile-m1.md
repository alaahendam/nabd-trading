# Mobile M1: Expo shell and tooling

Part of `docs/MOBILE-PLAN.md` (section 5). Goal: `apps/mobile` exists under the repo's TypeScript, ESLint, Prettier, test and commit rules, on an empty app. No features: the screens are placeholders, and what is real is the tooling, the configuration check and the spike.

## Step 0: the version facts, checked on 2026-11-25 from the npm registry and Expo's docs

| Fact                                                      | Value                                                                                                                                                                                                    |
| --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Latest Expo SDK                                           | 58 (`expo@58.0.26`); its React Native is 0.88.1, its React and React DOM exactly 19.3.0                                                                                                                  |
| Node                                                      | `^22.13 \|\| ^24.3 \|\| ^26` for Expo and React Native; the repo runs 24.13                                                                                                                              |
| Pinned module versions (from `bundledNativeModules.json`) | expo-router ~58.0.32, react-native-screens ~4.30.1, safe-area-context ~5.11.1, expo-linking ~58.0.17, expo-constants ~58.0.16, expo-status-bar ~58.0.5, @expo/metro-runtime ~58.0.17, jest-expo ~58.0.15 |
| Test tooling                                              | jest 30 (jest-expo on SDK 58 requires it), `@react-native/jest-preset` ^0.88.1, `@testing-library/react-native` 14.1.0 with the `test-renderer` ^1 peer                                                  |
| Lint                                                      | `eslint-plugin-react-native` 5.0.0 (peer eslint up to 9; documents only the old config format), `eslint-config-expo` 58.0.4 (flat, no React Native style rules)                                          |
| React pin                                                 | The repo pins 19.3.0 (ADR 0010): this matches the SDK                                                                                                                                                    |

## Decisions for this phase

- **Hand-written app, not `create-expo-app`.** The template brings its own lockfile, scripts and sample screens; the repo's tooling has to own all of that.
- **No `eslint-config-expo`.** It has no React Native style rules, and the repo's own React and hooks rules already exist. The mobile config is the repo's, plus React Native rules.
- **React Native lint rules:** `eslint-plugin-react-native` is tried under ESLint 9 first; a rule that does not run is written locally. The physical-direction and accessibility rules are local in any case (no standard plugin has them).
- **The configuration error screen** takes its words from `@nabd/i18n` (new keys, in English and Arabic), so the copy is shared and reviewed once.

## Tasks

- [x] **T1 Lint rules for mobile.** `@nabd/config/eslint/mobile`: boundaries (`app → features → shared/lib`, `providers`), restricted imports (socket, fetch, React DOM, chart library, apps, deep imports), React and hooks rules, i18n (no literal strings), the React Native rules (no inline styles, no color literals, no raw text outside `Text`), and the local rules (no physical direction, accessibility role and label on interactive elements) with their tests. Every rule shown to fail on a deliberate violation.
- [x] **T2 Configuration copy.** `config.error.*` strings in English and Arabic in `@nabd/i18n`.
- [x] **T3 The app shell.** `apps/mobile`: `package.json`, `app.config.ts`, Expo Router with the tabs and placeholder screens, the environment check (`EXPO_PUBLIC_API_URL`, required, a static `process.env` reference, Zod) and the configuration error screen, `.env.example`, TypeScript, Prettier, ESLint, jest-expo with RNTL and coverage thresholds. Test matrix first.
- [ ] **T4 Metro spike.** Does Metro bundle the compiled ESM packages (`exports` maps, `.js` extensions, dependencies like `socket.io-client` and `zod` behind pnpm's isolated installs)? Proven by an export build of an app that imports every package; the finding goes in an ADR.
- [ ] **T5 CI and gates.** A mobile CI job (lint, typecheck, test, `expo-doctor`, route type generation, an export build), the whole-repo gates, the spike's ADR, the README and plan updated.

## Gate for the phase

Lint, typecheck, test and build green on the empty app and the whole repo; every new mobile lint rule shown to fail on a deliberate violation; the spike answered with evidence; CI green on the pull request.
