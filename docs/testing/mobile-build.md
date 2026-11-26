# Mobile build configuration: test matrix (M5)

| ID     | Behaviour                                                                                                                      |
| ------ | ------------------------------------------------------------------------------------------------------------------------------ |
| BLD-01 | The `preview` profile builds an installable APK (not an app bundle) for internal distribution                                  |
| BLD-02 | The API address comes from an EAS environment; `eas.json` holds no address and no URL                                          |
| BLD-03 | **device** The APK installs on the author's phone and shows data from the deployed API                                         |
| BLD-04 | **device** The icon, the splash and the language switch look right on the APK                                                  |
| BLD-05 | The Expo config names the EAS project (an ID, which is not a secret) so a build knows where it goes                            |
| BLD-06 | The Expo config reads with no compiled workspace package present, as on the build server, and its brand color equals the token |
