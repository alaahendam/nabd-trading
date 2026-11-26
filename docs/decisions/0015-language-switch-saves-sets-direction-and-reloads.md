# 0015. Changing the language saves, sets the direction, and reloads

- Status: accepted
- Date: 2026-11-26

## Context

Arabic needs a right-to-left layout, and on React Native the layout direction is native state that only takes effect when the app starts again. So changing the language in the app cannot be a re-render. `docs/MOBILE-PLAN.md` planned `I18nManager.allowRTL` and `forceRTL`, then `Updates.reloadAsync()` from `expo-updates`, with `LocaleProvider` around the tree.

## Decision

`switchLanguage` (`apps/mobile/src/lib/i18n/switch-language.ts`) does four things in this order and nothing else: save the choice and wait for it (`StartupStorage.saveItem`, ADR 0014), `allowRTL(true)`, `forceRTL(direction is right-to-left)`, reload. Choosing the language already in use does nothing. If the choice cannot be saved the app is left alone, because a reload would bring the old language back with the wrong direction, and a message says so.

Two things differ from the plan:

- **`reloadAppAsync` from `expo`, not `Updates.reloadAsync`.** It reloads the running bundle without adding `expo-updates`, which the app has no other use for.
- **`LocaleProvider` is not used.** The language is read from storage at startup (ADR 0014) and handed to i18next once, so there is nothing for it to add.

The device calls live in `device-layout.ts`, a module the tests replace.

## What went wrong, and the fallback

In Expo Go, choosing a language saved it but nothing reloaded. `reloadAppAsync` calls `globalThis.expo?.reloadAppAsync(...)`; a host without that native function ignores the call without an error. The author noticed on the phone, because the language only changed after a manual reload (`d292085`).

So the reload asks the native side first, and in development (`__DEV__`) follows with React Native's `DevSettings.reload()`. If the native reload works, as it should in a built app, the fallback never runs. SWL-08 tests the order; SWL-09, the reload on the phone, was checked in Expo Go.

## Alternatives considered

- **`expo-updates`** as planned: one more native dependency for one call.
- **No reload:** the text would change but not the layout direction, which is the half that matters for Arabic.
- **Following the device language only:** SDK 58 does this by default, and it still works. It leaves a person whose phone is in English no way to read the app in Arabic.

## Consequences

- The switch restarts the app, so any unsaved state is lost. There is none today.
- In a release build there is no fallback: the native reload has to work. The author reported the installed APK worked on the phone; the language switch was not listed as a separate check, so this is the one thing worth looking at again on a build.
