# Test matrix: web i18n, RTL and formatters

Modules: `apps/web/src/lib/i18n` (`language.ts`, `resources.ts`, `i18n.ts`, `language-store.ts`, `i18n-provider.tsx`), `src/lib/format/format.ts`, and the language part of the pre-paint script in `index.html`.

## Purpose and public surface

- Languages: English (`en`, left to right) and Arabic (`ar`, right to left). `parseLanguage`, `detectLanguage({ stored, browser })` (a valid stored choice wins, then the first browser language whose primary subtag is supported, then English), `directionOf`, `applyDocumentLanguage`.
- `resources`: every user-facing string, typed (keys are checked at compile time through `i18next`'s `CustomTypeOptions`). Digits in strings are not written at all; numbers are interpolated and always Latin. The Arabic text was written by the assistant and has been reviewed by the project author.
- `createI18n(language)`: a ready i18next instance (synchronous init, English fallback, no HTML escaping because React escapes).
- `LanguageStore`: holds the language, persists it (`nabd.language`), switches i18next, and sets `lang` and `dir` on `<html>`. Storage and the root element are injected. `I18nProvider` and `useLanguage()` give React access.
- The inline script in `index.html` sets `lang` and `dir` (next to `data-theme`) before first paint; tests keep it in step with the logic.
- Formatters: financial figures use one notation in both languages: Latin digits, `.` decimals, `,` grouping, `$` prefix, explicit `+` and `-`, `K`/`M`/`B` suffixes. The UI isolates them left to right. (Intl's Arabic currency format puts the symbol after the number and adds invisible bidi marks, which would make figures unpredictable.) `formatPrice`, `formatChange`, `formatPercent`, `formatVolume`, `changeDirection`. Non-finite input renders as an em dash, never `NaN`.

## Cases: language logic

| ID     | Case                                   | Input / setup                                                                                                                              | Expected                                                                                                   | Level     |
| ------ | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------- | --------- |
| LNG-01 | Parsing                                | `en`, `ar`, `fr`, `''`, `null`                                                                                                             | `en`, `ar`, then `undefined` for the rest                                                                  | unit      |
| LNG-02 | Detection                              | stored `ar`; stored garbage with `['en-US']`; none with `['fr-FR','ar-EG']`; none with `['fr']`; none with `[]`; stored `en` with `['ar']` | `ar`; `en`; `ar`; `en`; `en`; `en`                                                                         | unit      |
| LNG-03 | Direction                              | each language                                                                                                                              | `ltr` for `en`, `rtl` for `ar`                                                                             | unit      |
| LNG-04 | Document attributes                    | `applyDocumentLanguage(root, 'ar')` and `'en'`                                                                                             | `lang` and `dir` set accordingly                                                                           | unit      |
| LNG-05 | Store initial state                    | stored `ar`; nothing stored with an Arabic browser; nothing at all                                                                         | i18next, root `lang` and `dir` and state agree with the detected language                                  | unit      |
| LNG-06 | Switching language                     | `setLanguage('ar')` then the same again                                                                                                    | i18next switches, `nabd.language` stored, root updated, subscribers notified once; the repeat does nothing | unit      |
| LNG-07 | Storage failures are tolerated         | `getItem` and `setItem` throw                                                                                                              | detection falls back to the browser; the choice still applies for the session                              | unit      |
| LNG-08 | Snapshot stability and unsubscribe     | `getState()` twice; unsubscribe a listener                                                                                                 | same object until a change; no notification after unsubscribing                                            | unit      |
| LNG-09 | The pre-paint script matches the logic | run the `index.html` script for the cases of LNG-02, plus storage throwing and a missing `navigator.languages`                             | `lang` and `dir` equal `detectLanguage` and `directionOf`                                                  | unit      |
| LNG-10 | The browser environment                | `browserLanguageEnvironment()` in jsdom                                                                                                    | reads and writes `localStorage`, reads `navigator.languages`, targets `document.documentElement`           | unit      |
| LNG-11 | `I18nProvider` and `useLanguage`       | render, switch language                                                                                                                    | translations, `dir` and `lang` follow; the setter is stable                                                | component |
| LNG-12 | Hooks need the provider                | `useLanguage` without it                                                                                                                   | a clear error message                                                                                      | component |

## Cases: resources

| ID     | Case                        | Input / setup                                                                                        | Expected                                                                                                | Level |
| ------ | --------------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | ----- |
| RES-01 | Same keys in both languages | flatten `en` and `ar`, ignoring plural suffixes                                                      | identical key sets                                                                                      | unit  |
| RES-02 | Complete plural forms       | each plural key in each language                                                                     | exactly the categories of `Intl.PluralRules` for that language (English `one`, `other`; Arabic all six) | unit  |
| RES-03 | Clean strings               | every string                                                                                         | not empty, no Arabic-Indic digits, no leading or trailing whitespace                                    | unit  |
| RES-04 | Same placeholders           | `{{...}}` in every string, English versus Arabic                                                     | the same set of placeholders per key                                                                    | unit  |
| RES-05 | Translating works           | `createI18n` for each language; a key; plurals for 0, 1, 2, 3, 11, 100 in Arabic and 1, 2 in English | the right language; correct plural form; counts appear as Latin digits                                  | unit  |
| RES-06 | Fallback                    | `createI18n('en')` asked for a key missing in `ar` by switching to a language without it (simulated) | falls back to English instead of showing the key                                                        | unit  |

## Cases: formatters

| ID     | Case                    | Input / setup                                           | Expected                                                                                                 | Level |
| ------ | ----------------------- | ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | ----- |
| FMT-01 | Price                   | `1234.5`, `0.05`, `1000000`, `0`                        | `$1,234.50`, `$0.05`, `$1,000,000.00`, `$0.00`                                                           | unit  |
| FMT-02 | Change                  | `2.44`, `-2.44`, `0`, `-0`, `0.004`, `-0.004`           | `+$2.44`, `-$2.44`, `$0.00`, `$0.00`, `$0.00`, `$0.00` (rounds first, so no `-$0.00`)                    | unit  |
| FMT-03 | Percent                 | `2.456`, `-0.5`, `0`, `0.004`, `-0.004`, `12`           | `+2.46%`, `-0.50%`, `0.00%`, `0.00%`, `0.00%`, `+12.00%`                                                 | unit  |
| FMT-04 | Volume                  | `0`, `950`, `1500`, `1234567`, `55000000`, `3200000000` | `0`, `950`, `1.5K`, `1.2M`, `55M`, `3.2B`                                                                | unit  |
| FMT-05 | Direction               | `1`, `-1`, `0`, `0.004`, `-0.004`, `0.005`              | `up`, `down`, `flat`, `flat`, `flat`, `up` (the same rounding the text uses)                             | unit  |
| FMT-06 | Non-finite input        | `NaN`, `Infinity`, `-Infinity` in each formatter        | an em dash                                                                                               | unit  |
| FMT-07 | Digits are always Latin | each formatter over a range of values                   | output has only characters from ASCII digits, `.`, `,`, `$`, `+`, `-`, `%`, letters `KMB`, or an em dash | unit  |
| FMT-08 | Percent without a sign  | `2.456`, `-2.456`, `0`, `-0.004`, `NaN`                 | `2.46%`, `2.46%`, `0.00%`, `0.00%`, an em dash (for a sentence that says up or down in words)            | unit  |

## Coverage target

100% statements, branches, functions and lines for `lib/i18n` (logic files) and `lib/format` (per-file thresholds). `resources.ts` is data, exercised by the RES cases.

## Out of scope

Date and time formatting for chart axes (Phase 5), the language toggle component (shell, Task 11).
