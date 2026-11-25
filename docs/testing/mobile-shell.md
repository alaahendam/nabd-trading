# Mobile shell: test matrix

Scope: `apps/mobile` as of M1: the environment check, the configuration error screen and the gate around the app, the routes (two tabs and a not-found screen), and proof that the shared packages load under Jest. Tests run in Jest with jest-expo and React Native Testing Library (ADR 0002, Amendment). Everything else in the app is placeholder until M2.

## Environment (`src/lib/env.ts`)

`readEnv` takes the values the app read from `process.env` with static references (Expo inlines only those) and returns either the settings or the list of problems, never a half-valid object.

| ID     | Behavior                               | Input                                              | Expected                                                 | Level |
| ------ | -------------------------------------- | -------------------------------------------------- | -------------------------------------------------------- | ----- |
| ENV-01 | A valid https URL is accepted          | `https://api.example.com`                          | `ok`, `apiUrl` is that URL                               | unit  |
| ENV-02 | A local http URL is accepted           | `http://10.0.2.2:3000`, `http://192.168.1.20:3000` | `ok` (the emulator and a phone on the network)           | unit  |
| ENV-03 | Trailing slashes are removed           | `https://api.example.com//`                        | `apiUrl` has none                                        | unit  |
| ENV-04 | A missing value is a "missing" problem | `undefined`, `''`, spaces                          | not ok, one problem for `EXPO_PUBLIC_API_URL`, `missing` | unit  |
| ENV-05 | A value that is not a URL is "invalid" | `api.example.com` (no scheme), `not a url`         | not ok, `invalid`                                        | unit  |
| ENV-06 | Only http and https are accepted       | `ftp://api.example.com`, `javascript:alert(1)`     | not ok, `invalid`                                        | unit  |
| ENV-07 | Surrounding spaces are ignored         | `  https://api.example.com  `                      | `ok`, trimmed                                            | unit  |

## Configuration error screen and gate

| ID     | Behavior                                                | Input                        | Expected                                                               | Level     |
| ------ | ------------------------------------------------------- | ---------------------------- | ---------------------------------------------------------------------- | --------- |
| CFG-01 | The screen says what is wrong, in words                 | a "missing" problem, English | title, description, "EXPO_PUBLIC_API_URL: it is missing", and the hint | component |
| CFG-02 | An invalid value reads differently                      | an "invalid" problem         | "EXPO_PUBLIC_API_URL: it is not a valid URL"                           | component |
| CFG-03 | Every problem is listed                                 | two problems                 | two lines                                                              | component |
| CFG-04 | It speaks Arabic when the app does                      | the Arabic i18n instance     | the Arabic title and description                                       | component |
| CFG-05 | The title is a header for a screen reader               | the screen                   | the title has the header role                                          | component |
| CFG-06 | The gate shows the app when the settings are valid      | `ok` result                  | the children, and no error screen                                      | component |
| CFG-07 | The gate shows the error screen, not the app, otherwise | a result with problems       | the error screen, and the children are not rendered                    | component |

## Routes (`app/`)

| ID     | Behavior                                    | Input                  | Expected                                                   | Level     |
| ------ | ------------------------------------------- | ---------------------- | ---------------------------------------------------------- | --------- |
| ROU-01 | The first tab is the stock list placeholder | open `/`               | the "Stocks" title is shown and the Stocks tab is selected | component |
| ROU-02 | The second tab is the watchlist             | open `/watchlist`      | the "Watchlist" title is shown                             | component |
| ROU-03 | An unknown route shows the not-found screen | open `/no-such-screen` | the "Page not found" copy                                  | component |

## Workspace packages under Jest

| ID     | Behavior                                           | Input                                    | Expected                                                            | Level |
| ------ | -------------------------------------------------- | ---------------------------------------- | ------------------------------------------------------------------- | ----- |
| PKG-01 | Every shared package loads and does one real thing | one call into each of the seven packages | no resolution or transform error; each answer is the expected value | unit  |

## Lint rules (shown to fail on a deliberate violation, not unit-tested here)

Inline style, color literal and raw text outside `Text` (eslint-plugin-react-native); physical direction and a control without a role and label (local rules, unit-tested in `@nabd/config`); a literal string in JSX; a feature internal import; a socket, fetch, React DOM or app import. The evidence is in the M1 close-out.

## Coverage

At least 90% overall for `src` and `app`; 100% for `src/lib/env.ts`.
