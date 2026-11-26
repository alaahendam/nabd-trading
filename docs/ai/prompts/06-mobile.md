# The mobile app: what was said

The messages that drove the mobile branch, quoted as the author typed them (typos and all, so **not adapted**). They are short for the same reason as the earlier phases: the work was steered by standing context, not by long prompts.

## The standing context

- `CLAUDE.md`: one commit per addition, every commit green, never bypass a rule, test matrix first, stage files explicitly.
- `docs/MOBILE-PLAN.md`: the plan with its milestones (M0 to M5), its scope-protection order, and what was still unverified.
- `tasks/mobile-m*.md` and `docs/testing/mobile-*.md`: each milestone's task list and test matrix, written before its code.
- The pre-push hook and CI: the whole repository's gates, so the agent could not claim a milestone done while the web app was red.

## The messages, in order

| Message                                                                                                                                  | What it did                                                                                                                 |
| ---------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| "when i can run it on my mobile and how ?"                                                                                               | Asked for the first real-device route; led to Expo Go on the author's phone, and a QR code.                                 |
| "already installed the app from play store could you plz complete all work until the QR scan"                                            | Said Expo Go was installed; the agent did everything up to the scan.                                                        |
| "stocks and watch list appear on the app without any data from the backend"                                                              | A bug report: the app ran but showed no data. The placeholder tabs of the shell came before the data layer, which M2 added. |
| "start M2", "Start M3"                                                                                                                   | The go-ahead for a milestone. The agent did not start the next one without it.                                              |
| "Do the Intl check first"                                                                                                                | The author's choice between two orders of work; the Hermes `Intl` check ran on the phone before more code.                  |
| "Readable", "Looks right", "Flips correctly", "Yes, I feel it", "the icons appear"                                                       | The device checks. A device row in a matrix was ticked only after one of these.                                             |
| "arabic buttion not clicked"                                                                                                             | The bug report that found the silent reload in Expo Go (lesson 14).                                                         |
| "i dont understand way you need to update the apis? in the web there is star beside the stock on stocks page way we can't in the mobile" | A correction: the agent's test code made the change sound bigger than it was. The change was one line on the Stocks tab.    |
| "Yes, build", "rebuild the APK plz"                                                                                                      | The approval for each EAS build, which is counted on the free plan.                                                         |
| "contanuo and complete M5 plz"                                                                                                           | Asked for the rest of M5; the agent did what it could and listed what only the author can do.                               |

## What was not delegated

- How to make the app icon was put to the author as a question; they chose the generated one. The agent drew it, the heartbeat line was its design, and the author did not ask for another.
- The cut of the Maestro flows was the agent's decision, made on the plan's own cut order and reported to the author, who could overrule it and did not.
- The statement of how the app was made is the author's, in their own words, and is not in this file.
