# Mobile foundation: test matrix (M2)

Written before the code. IDs appear in the test names. jest-expo with React Native Testing Library; fakes are plain recorders (`@nabd/testing`), no `jest.fn` inside shared fakes.

## Startup storage

| ID     | Behaviour                                                                        |
| ------ | -------------------------------------------------------------------------------- |
| STO-01 | After loading, `getItem` returns the stored values of the three known keys       |
| STO-02 | A key that was never stored returns `null`                                       |
| STO-03 | `setItem` is visible at once to `getItem` and is written to the real storage     |
| STO-04 | If reading fails, loading still resolves, with every value `null`                |
| STO-05 | If writing fails, `setItem` does not throw and the value is kept for the session |
| STO-06 | The client ID provider on top of it reuses a stored ID and stores a new one      |

## Theme

| ID     | Behaviour                                                                              |
| ------ | -------------------------------------------------------------------------------------- |
| THM-01 | A missing or invalid stored preference is `system`                                     |
| THM-02 | `system` resolves to the device scheme (light or dark), and follows it when it changes |
| THM-03 | An explicit `light` or `dark` ignores the device scheme                                |
| THM-04 | `setPreference` persists the value and notifies subscribers once                       |
| THM-05 | Setting the same preference does not notify                                            |
| THM-06 | `useTheme` gives the colors of the resolved theme from the tokens                      |
| THM-07 | `Text` and `Screen` use the theme's colors in light and in dark                        |

## Language

| ID     | Behaviour                                           |
| ------ | --------------------------------------------------- |
| LNG-01 | A stored supported language is used                 |
| LNG-02 | A missing or unsupported stored value gives English |

## Network, queries and lifecycle

| ID     | Behaviour                                                                                 |
| ------ | ----------------------------------------------------------------------------------------- |
| NET-01 | The connectivity adapter reports online when connected and reachable, offline otherwise   |
| NET-02 | Reachability `undefined` counts as online (it is unknown, not lost)                       |
| NET-03 | It notifies on network state changes, and stops after unsubscribing                       |
| QRY-01 | The app becoming `active` marks the query client focused, `background` marks it unfocused |
| QRY-02 | The online manager follows the connectivity adapter                                       |
| LIF-01 | Going to the background disconnects the realtime client, status `offline`                 |
| LIF-02 | Returning to `active` connects it again and the active subscriptions are asked for again  |
| LIF-03 | While in the background, a held price is `stale`                                          |
| LIF-04 | Unmounting stops listening to `AppState`                                                  |

## Bootstrap and splash

| ID      | Behaviour                                                                      |
| ------- | ------------------------------------------------------------------------------ |
| BOOT-01 | The splash screen is kept visible from the start                               |
| BOOT-02 | Nothing is rendered until storage and fonts are ready                          |
| BOOT-03 | When ready, the children render and the splash is hidden once                  |
| BOOT-04 | If fonts fail to load, the app still starts (system font) and hides the splash |
| BOOT-05 | Leaving before it is ready neither renders the children nor hides the splash   |

## Screens

| ID     | Behaviour                                                                                      |
| ------ | ---------------------------------------------------------------------------------------------- |
| CON-01 | The connection status shows the translated label of each of the four states                    |
| CON-02 | It is a polite live region, so a change is announced once, never per tick                      |
| ERR-01 | The error screen shows the translated title and description and a retry button                 |
| ERR-02 | Pressing retry calls the retry function                                                        |
| ERR-03 | The retry button has a role and a label, and is at least 48 high                               |
| ROU-04 | `/stock/AAPL` opens the detail placeholder with the symbol, above the tabs, with a back action |
| ROU-05 | The simulated-data notice is on the tab screens                                                |

Coverage: at least 90% overall, 100% for `src/lib` logic (storage, theme store, connectivity, lifecycle).
