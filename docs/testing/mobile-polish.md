# Mobile polish: test matrix (M4)

Written before the code, as `tasks/mobile-m4.md` says. Rows marked **device** cannot be proved by Jest and are checked on the author's phone; the result is recorded in the task, not here.

## Tabs

| ID     | Behaviour                                                                  |
| ------ | -------------------------------------------------------------------------- |
| TAB-01 | Each tab has an icon, and the tab is named by its title, not by the icon   |
| TAB-02 | The icon takes the active and inactive colors of the theme, in both themes |
| TAB-03 | **device** The icons draw (they are not empty boxes) on the phone          |
| TAB-04 | A third tab, Settings, has an icon and is named by its title               |

## Safe areas

| ID     | Behaviour                                                                      |
| ------ | ------------------------------------------------------------------------------ |
| SAF-01 | A screen's content is padded by the device insets, never drawn under them      |
| SAF-02 | **device** Nothing is under the status bar, the gesture bar or a camera cutout |

## Dynamic Type

| ID     | Behaviour                                                                              |
| ------ | -------------------------------------------------------------------------------------- |
| DYN-01 | Text scales with the system font size, up to a cap of twice its size                   |
| DYN-02 | The cap is one value in one place                                                      |
| DYN-03 | **device** At the largest system size, a row, the detail and the periods stay readable |

## Screen sizes

The narrowest phone supported is 320 points wide, which leaves 288 inside the screen's padding. These rows prove the layout rules, not the pixels: a test cannot measure a screen.

| ID     | Behaviour                                                                                                 |
| ------ | --------------------------------------------------------------------------------------------------------- |
| SIZ-01 | No loading placeholder (list, detail, chart, watchlist) has a fixed width over 288                        |
| SIZ-02 | A stock row's name column has a base width, and the figures move under it when there is no room beside it |
| SIZ-03 | A figure on the detail moves under its label when the two do not fit on one line                          |
| SIZ-04 | The period buttons and the language options wrap onto a second line instead of running off the screen     |
| SIZ-05 | **device** On the smallest and largest display sizes, with the largest font, nothing is cut off sideways  |

## Haptics

| ID     | Behaviour                                                               |
| ------ | ----------------------------------------------------------------------- |
| HAP-01 | Pressing the star gives a light tap                                     |
| HAP-02 | Choosing a period gives a light tap, and choosing the same one does not |
| HAP-03 | A device that cannot vibrate does not make the press fail               |

## Reduced motion

| ID     | Behaviour                                                                            |
| ------ | ------------------------------------------------------------------------------------ |
| MOT-01 | The app has no animation to switch off; a test fails if one is added without a guard |

## Accessibility pass

| ID     | Behaviour                                                                       |
| ------ | ------------------------------------------------------------------------------- |
| A11-01 | Every pressable on every screen has a role and a name, and is at least 48 by 48 |
| A11-02 | Every screen has one header, and state changes are announced (busy, alert)      |
| A11-03 | Nothing is conveyed by color alone (sign, word or icon accompanies it)          |

## Icon and splash

| ID     | Behaviour                                                                 |
| ------ | ------------------------------------------------------------------------- |
| ICN-01 | The configuration names an icon, an adaptive icon and a splash that exist |
| ICN-02 | **device** The icon and the splash look right on the phone                |

## Language switch

| ID     | Behaviour                                                                                                                                                                   |
| ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SWL-01 | Choosing Arabic saves it, sets the layout direction right-to-left, and reloads                                                                                              |
| SWL-02 | Choosing the language already in use does nothing                                                                                                                           |
| SWL-03 | The choice is read at startup, so the first frame is already in that language                                                                                               |
| SWL-04 | **device** On a development build, the layout flips and the numerals stay Latin                                                                                             |
| SWL-05 | A Settings tab lists both languages by their own names, the current one selected, each at least 48 high                                                                     |
| SWL-06 | Choosing the other language runs the switch: saved, direction set, reloaded                                                                                                 |
| SWL-07 | If the choice cannot be saved, a message says so and nothing reloads                                                                                                        |
| SWL-08 | The reload asks the native side first, and in development falls back to the dev menu's reload, because a host without the native call (Expo Go) ignores it without an error |
| SWL-09 | **device** In Expo Go the app reloads by itself after choosing a language, with no manual reload                                                                            |
| STO-07 | A value can be saved and awaited, for a change that is followed by a reload                                                                                                 |
| STO-08 | A value that did not reach storage is reported, and still kept for the session                                                                                              |
