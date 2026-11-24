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
