# Mobile M4: polish

Part of `docs/MOBILE-PLAN.md` (section 5). Goal: the three features of M3, finished the way a phone expects: icons, safe areas, text that scales, haptics, the app's own icon and splash, and the Arabic layout switch. Cut order if time runs short (plan, section 6): Maestro flows, then haptics, then the in-app language switch.

## Decisions for this phase

- **Verification is split honestly.** Jest proves what a test can (props, roles, calls to the device APIs through fakes). What only a device shows (the layout flip, icons, splash, large text) is checked on the author's phone, and each such task says so; none is ticked on a test alone.
- **Tab icons** come from `@expo/vector-icons` (Ionicons), declared as a dependency of the app, with an accessible name from the tab title, not the glyph.
- **Dynamic Type:** text scales with the system font size, up to a cap, so a layout never has to survive an unbounded size. Rows wrap instead of clipping.
- **Reduced motion:** nothing in the mobile app animates today (skeletons are static, prices do not flash), so there is nothing to switch off; this is recorded in the matrix and revisited if an animation is added.
- **Haptics** are a light tap on the star and on the period buttons, through `expo-haptics`, behind a small function so tests assert the call.
- **Language switch:** the layout direction follows the language; changing it needs a reload (`I18nManager`, `Updates.reloadAsync`), which only a development build or the APK can show, not Expo Go.

## Tasks

- [x] **T1 Test matrix.** `docs/testing/mobile-polish.md`, before the code.
- [x] **T2 Tab icons.** An icon per tab, named by its title; checked on the phone.
- [x] **T3 Safe areas.** Screens and the tab bar clear the notch, the gesture bar and the cutout, in both orientations of use (portrait only is supported).
- [x] **T4 Dynamic Type.** Scaling with a cap; rows and the period switcher survive large sizes.
- [ ] **T5 Haptics.** The star and the period buttons.
- [ ] **T6 Accessibility pass.** Every screen walked in tests for role, name, state and focus order; fixes.
- [ ] **T7 Icon and splash.** The app's own icon and splash, in the theme's colors; checked on the phone.
- [ ] **T8 Language switch.** The Arabic layout flip with a reload; checked on a development build.
- [ ] **T9 Maestro flows** for the main path (cuttable).
- [ ] **T10 Gates.** Whole-repo gates, CI green on the PR, plan ticked, README limits.

## Gate

Lint, typecheck, test and build green; every task's device check done on the author's phone and recorded; CI green on the PR.
