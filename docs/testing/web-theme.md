# Test matrix: web theme and design tokens

Modules: `apps/web/src/lib/theme` (`theme.ts`, `theme-hooks.tsx`), `src/styles/tokens.css`, `src/styles/index.css`, the pre-paint script in `index.html`. Design: ADR 0006.

## Purpose and public surface

- `parseThemePreference(value)`: `light`, `dark` or `system`; anything else is `system`.
- `resolveTheme(preference, systemPrefersDark)`: the theme to show.
- `ThemeStore`: holds `{ preference, resolved }`, persists the preference in `localStorage` (`nabd.theme`), sets `data-theme` on `<html>`, and follows the operating system while the preference is `system`. Storage, `matchMedia` and the root element are injected. `browserThemeEnvironment()` wires the real ones.
- `ThemeProvider` and `useTheme()`: React access to the store.
- The inline script in `index.html` sets `data-theme` before first paint, so there is no flash. It duplicates the store's logic in a few lines, and a test keeps the two in step.
- `tokens.css`: primitives and semantic tokens, light by default, dark redefining the semantic layer. `index.css` maps utilities to semantic tokens only.

## Cases: theme logic

| ID     | Case                                   | Input / setup                                                                                                                                              | Expected                                                                                                                     | Level     |
| ------ | -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | --------- |
| THM-01 | Parsing a preference                   | `light`, `dark`, `system`, `''`, `blue`, `null`, `5`                                                                                                       | the three valid values pass through; everything else is `system`                                                             | unit      |
| THM-02 | Resolving a preference                 | each preference with the OS dark and light                                                                                                                 | `system` follows the OS; `light` and `dark` ignore it                                                                        | unit      |
| THM-03 | Initial state                          | stored `dark`; stored garbage; nothing stored                                                                                                              | `dark`; `system`; `system`; `data-theme` set on the root accordingly                                                         | unit      |
| THM-04 | Setting a preference                   | `setPreference('dark')`                                                                                                                                    | state changes, `nabd.theme` stored, `data-theme` updated, subscribers notified; setting the same value again notifies nobody | unit      |
| THM-05 | `system` follows the OS live           | OS flips while `system`; while `dark`; back to `system`                                                                                                    | resolved theme follows the flip only while `system`; switching back resolves the current OS                                  | unit      |
| THM-06 | Storage failures are tolerated         | `getItem` throws; `setItem` throws                                                                                                                         | falls back to `system`; the preference still applies for the session                                                         | unit      |
| THM-07 | `dispose` stops listening              | dispose, then an OS change                                                                                                                                 | state unchanged, no notification                                                                                             | unit      |
| THM-08 | Snapshots are stable                   | `getState()` twice, then after a change                                                                                                                    | same object until a change, a new object after                                                                               | unit      |
| THM-09 | The browser environment                | `browserThemeEnvironment()` in jsdom with a `matchMedia` stub                                                                                              | reads and writes `localStorage`, queries `matchMedia`, targets `document.documentElement`                                    | unit      |
| THM-10 | The pre-paint script matches the logic | run the `index.html` script for: stored `dark`, stored `light` with OS dark, nothing with OS dark, nothing with OS light, stored garbage, storage throwing | `data-theme` equals `resolveTheme(parseThemePreference(stored), osDark)` in every case                                       | unit      |
| THM-11 | `ThemeProvider` and `useTheme`         | render, call `setPreference`                                                                                                                               | the component shows the new preference and resolved theme; the DOM attribute follows                                         | component |
| THM-12 | `useTheme` needs the provider          | render without it                                                                                                                                          | a clear error message                                                                                                        | component |

## Cases: tokens

| ID     | Case                                                 | Input / setup                                                                                                                                                           | Expected                                                                                    | Level |
| ------ | ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | ----- |
| TOK-01 | Text pairs meet WCAG AA contrast in both themes      | primary and muted text on surface, raised and sunken; text on brand and on accent; positive and negative on surface, raised and their subtle backgrounds; brand as text | each pair at least 4.5:1                                                                    | unit  |
| TOK-02 | Non-text pairs meet 3:1 in both themes               | watch star, focus ring and strong border on surface and raised                                                                                                          | each pair at least 3:1                                                                      | unit  |
| TOK-03 | Dark redefines the whole semantic layer              | semantic tokens of the light block versus the dark block                                                                                                                | every semantic token is defined in dark, so nothing falls back to a light value by accident | unit  |
| TOK-04 | The theme maps every semantic color and nothing else | `@theme` in `index.css` versus the semantic tokens                                                                                                                      | every color token maps to an existing semantic token, and every semantic color is mapped    | unit  |
| TOK-05 | Market colors are not the brand green                | positive and brand in both themes                                                                                                                                       | the positive color differs from the brand color                                             | unit  |

## Coverage target

100% statements, branches, functions and lines for `lib/theme` (per-file thresholds).

## Out of scope

Visual regression of the real pages (checked by eye in the browser run, Task 12), the theme toggle component (shell, Task 11).
