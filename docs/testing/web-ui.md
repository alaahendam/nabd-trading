# Web UI atoms and app shell: test matrix

Scope: `src/shared/ui` (Button, Badge, ConnectionBadge), `src/app` (providers, router, error
boundary, shell, placeholder pages). Written before the code.

Conventions: text comes from i18n, so tests assert on the English strings through a helper that
wraps the tree in an i18next instance. Queries are by role and accessible name, never by class.

## Atoms

| ID    | Behavior                         | Input                                       | Expected                                                 | Level     |
| ----- | -------------------------------- | ------------------------------------------- | -------------------------------------------------------- | --------- |
| UI-01 | Button defaults to type button   | `<Button>Go</Button>` in a form             | `type="button"`; clicking it does not submit the form    | component |
| UI-02 | Button accepts a submit type     | `type="submit"`                             | `type="submit"`                                          | component |
| UI-03 | Button click and disabled        | click; then `disabled`                      | handler runs once; disabled button does not fire         | component |
| UI-04 | Button variants and sizes differ | each variant and size                       | each yields a distinct class list                        | unit      |
| UI-05 | Button keeps a caller class      | `className="extra"`                         | the element has `extra` as well as its variant classes   | component |
| UI-06 | Button forwards props            | `aria-pressed`, `aria-label`, `data-testid` | present on the element                                   | component |
| UI-07 | Badge renders its tone           | each tone with text                         | text is visible; tones yield distinct class lists        | component |
| UI-08 | ConnectionBadge per status       | each of the four statuses                   | `role="status"` with the localized label for that status | component |
| UI-09 | ConnectionBadge in Arabic        | `ar` instance, `offline`                    | the Arabic label                                         | component |
| UI-10 | ConnectionBadge hides the dot    | any status                                  | the dot is `aria-hidden`; the name is the label only     | component |

## App shell

| ID     | Behavior                      | Input                                    | Expected                                                               | Level     |
| ------ | ----------------------------- | ---------------------------------------- | ---------------------------------------------------------------------- | --------- |
| APP-01 | Providers compose             | render `Providers` with fakes            | children can use theme, language, API, query client and realtime hooks | component |
| APP-02 | Shell landmarks               | render the shell                         | one `banner`, one `navigation`, one `main`; a skip link to `#main`     | component |
| APP-03 | Skip link                     | tab once                                 | the skip link is first and is focusable                                | component |
| APP-04 | Navigation                    | click Watchlist                          | the watchlist page shows and its link has `aria-current="page"`        | component |
| APP-05 | Unknown route                 | `/nope`                                  | the not-found page with a link back to stocks                          | component |
| APP-06 | Theme switcher                | choose Dark                              | the preference changes and the control reports the choice              | component |
| APP-07 | Language switcher             | choose Arabic                            | text is Arabic and `document.documentElement.dir` is `rtl`             | component |
| APP-08 | Connection badge in the shell | fake realtime client goes connected      | the badge reads Live, then Reconnecting… after a disconnect            | component |
| APP-09 | Simulated-data notice         | render the shell                         | the simulated badge is visible and described                           | component |
| APP-10 | Error boundary catches        | a child throws                           | the error page with a retry button; no crash of the shell              | component |
| APP-11 | Error boundary retry          | click Try again after the fault is fixed | the child renders again                                                | component |
| APP-12 | Error boundary logs           | a child throws                           | the error is reported through the injected `onError`                   | component |
| APP-13 | Lazy page loading             | navigate to a lazy page                  | a status with the loading text shows, then the page                    | component |
| APP-14 | Document title                | navigate between pages                   | `document.title` follows the page and the language                     | component |
| APP-15 | App composition               | render `App` with fakes                  | the stocks page renders inside the shell                               | component |

## Phase 5 atoms

| ID    | Behavior                                | Input                                                                        | Expected                                                                                             | Level     |
| ----- | --------------------------------------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | --------- |
| UI-11 | Skeleton is decorative                  | `<Skeleton className="x" />`                                                 | hidden from assistive technology, keeps the caller class                                             | component |
| UI-12 | ChangeBadge up                          | change 1.5, percent 0.85                                                     | text `+$1.50 (+0.85%)`, an up arrow, and "Up" for screen readers                                     | component |
| UI-13 | ChangeBadge down                        | change -2, percent -1.2                                                      | text `-$2.00 (-1.20%)`, a down arrow, and "Down" for screen readers                                  | component |
| UI-14 | ChangeBadge flat                        | change 0, percent 0; and 0.004 (rounds to zero)                              | text `$0.00 (0.00%)`, a dash, and "Unchanged"                                                        | component |
| UI-15 | ChangeBadge never relies on color alone | each direction                                                               | the arrow is `aria-hidden`; the sign or word carries the meaning; each direction has own classes     | component |
| UI-16 | ChangeBadge tolerates bad numbers       | `NaN`                                                                        | dashes, "Unchanged", no throw                                                                        | component |
| UI-17 | ChangeBadge speaks Arabic               | `ar`, up and down                                                            | the Arabic words for up and down, figures still Latin                                                | component |
| UI-18 | StateMessage empty and error            | `tone="empty"`; `tone="error"`; with and without an action and a description | empty is a `status`, error is an `alert`; title always shown; description and action only when given | component |

## Chart attribution

| ID     | Behavior                                   | Input            | Expected                                                                                                   | Level     |
| ------ | ------------------------------------------ | ---------------- | ---------------------------------------------------------------------------------------------------------- | --------- |
| APP-18 | The chart library is credited              | render the shell | the footer links to tradingview.com with the library's notice text, opening safely in a new tab            | component |
| APP-18 | The notice stays English and left to right | render in Arabic | the notice carries `lang="en"` and `dir="ltr"`, so the legal text and the trademark sign are not reordered | component |

## Select and icons

| ID     | Behavior                         | Input                                               | Expected                                                                                             | Level     |
| ------ | -------------------------------- | --------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | --------- |
| UI-19  | A labeled native select          | label, value and three options                      | a combobox with that accessible name, the options in order, and the value selected                   | component |
| UI-20  | Choosing reports the value       | pick another option with the keyboard and the mouse | `onChange` is called once with that option's value                                                   | component |
| UI-21  | The icons are decorative         | an icon and the built-in chevron                    | both are hidden from assistive technology and do not take clicks                                     | component |
| UI-22  | An option can carry its language | an option with `lang="ar"`                          | the option element has that `lang`, so it is spoken and shaped correctly                             | component |
| UI-23  | Disabled                         | `disabled`                                          | the select is disabled                                                                               | component |
| UI-24  | Icons                            | each of sun, moon, monitor, globe and chevron       | an svg that is hidden from assistive technology, takes its color from the text, and is not focusable | component |
| APP-06 | Theme select                     | choose Dark in the theme select                     | the preference changes and the select shows the choice with the matching icon                        | component |
| APP-07 | Language select                  | choose Arabic in the language select                | text is Arabic and `document.documentElement.dir` is `rtl`                                           | component |
