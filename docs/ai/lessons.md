# Lessons: where AI output was wrong or not good enough

Concrete cases from this repository. Each says what went wrong, how it was caught, and what changed, with evidence you can check: a commit (`git show <hash>`), a test ID in `docs/testing/`, or an ADR. Nothing here is a general claim about AI; it is what happened in this repo.

## Summary

| #   | What was wrong                                                         | Caught by                                | Evidence                        |
| --- | ---------------------------------------------------------------------- | ---------------------------------------- | ------------------------------- |
| 1   | The plan asked for Jest, which Nest 12 no longer supports              | Reading the framework docs at build time | ADR 0002                        |
| 2   | Lint rules written before the code blocked valid code on first contact | Running the rules for the first time     | `657af21`, `a826f1f`            |
| 3   | A smoke test passed for the wrong reason                               | Review of what the test actually read    | `2a9cc44`                       |
| 4   | A socket bug that no unit test imagined                                | Firing browser events in a real browser  | `6eb49c1`, RTC-24               |
| 5   | The chart was rebuilt on every language switch                         | A new test written for the feature       | `e0745cb`, CHT-18               |
| 6   | Visual and RTL problems that passing tests could not see               | The human looking at the running app     | `40166b8`, `e0745cb`            |
| 7   | Two accessibility bugs in components that passed their component tests | axe in a real browser                    | `f280a20`                       |
| 8   | The plan expected route splitting to shrink the bundle; it did not     | Building it and measuring                | ADR 0009                        |
| 9   | Tests that assumed timing, and a sleep, that fail on a slower machine  | The first run on GitHub's Linux runners  | `dfc4858`, `77df30a`, `ebf03f0` |
| 10  | Checks that passed without checking anything                           | Negative controls                        | `7034639`, `83d8669`            |
| 11  | An RTL text bug visible only in the README screenshots                 | Looking at the generated screenshots     | `44e61f4`                       |
| 12  | Documentation that had drifted from the code                           | Checking each ADR against the code       | `bf1b22b`                       |
| 13  | Deployment failed twice on configuration, once silently                | The platform log and the browser console | `docs/deployment.md`            |

## 1. A plan that was wrong about the ecosystem

`docs/PLAN.md` specified Jest for the server. Nest 12 is ESM-only and its documentation generates Vitest projects, so Jest would have meant experimental flags or an older Nest. Found while planning Phase 1 (the plan commit `be63d96` records it), written up in ADR 0002, and the plan was updated. **Lesson:** a plan written before the code is a hypothesis; the first phase that touches a tool should check the tool's current documentation, and the change should be an ADR, not a quiet edit.

## 2. Rules that fail on first contact

The lint rules were written in Phase 0, before there was code to lint. Two of them rejected valid code the first time they met it: `no-extraneous-class` flagged every empty NestJS `@Module` (`657af21`), and the kebab-case property rule in Stylelint rejected Tailwind v4's `--color-*: initial` (`a826f1f`). In both cases the rule stayed on and was narrowed with its documented option, and the Stylelint change was checked with a throwaway bad name. **Lesson:** rules encoded ahead of the code need a first-contact check, and the fix is a narrower rule, never a disabled one.

## 3. A test that passed for the wrong reason

The Playwright smoke test read the page title before React had rendered, so it passed on the static `<title>`. It was found at the end of Phase 4, and the test now waits for the redirect to `/stocks` and checks the localized title, the banner, the heading and the simulated-data notice (`2a9cc44`). **Lesson:** a green test proves nothing until you know what it would take to make it red.

## 4. A bug only a real browser produces

When the browser fires `offline` and then `online` before Socket.IO notices the transport dropped, the socket is still connected, so "coming online" did nothing and the status stayed "Offline" while prices kept flowing. Found by dispatching those two events in a real browser; the unit test RTC-24 was written to reproduce it and failed before the fix (`6eb49c1`).

## 5. A dependency in the wrong place

The first version of the chart's language support rebuilt the whole chart on every language switch, because the creation effect depended on the language. The test written for the feature caught it; the locale is now read through a ref and CHT-18 pins it (`e0745cb`).

## 6. What passing tests could not see

After Phase 5 everything was green, and the user looked at the app and found problems no test covered: buttons without a pointer cursor (Tailwind 4 dropped it), the stats not lining up with their labels in Arabic, a time axis with Arabic-Indic digits next to Latin figures, a light theme that looked washed out (`40166b8`, `e0745cb`, and the design round in `prompts/02-design-polish.md`). **Lesson:** tests check what you thought of; a person looking at the real screen finds what you did not. Several later checks exist because of this round (the Arabic browser spec, the 320 px spec, the screenshots).

## 7. Accessibility bugs behind passing tests

jsdom component tests passed, and the components still had two real problems that only a browser's accessibility tree shows. axe found them on the first run: the period buttons were named "Past week" while showing "1W", so a voice-control user could not say what they saw, and the TradingView link inside the chart sat inside an image role, which nests interactive content in an image. Both were fixed in the product, nothing was excluded (`f280a20`).

## 8. A plan that expected the wrong result

The Phase 6 plan said splitting the three pages by route would shrink the main chunk. It was built and measured: the page chunks were 0.35 kB each, the shared code moved into one big chunk, and a first visit made more requests for the same bytes. It was reverted, and ADR 0009 records the measurement and what was done instead (vendor chunks, for caching). **Lesson:** "obviously a good idea" is still a claim; measure it.

## 9. Timing assumptions that fail on someone else's machine

The first run on GitHub's Linux runners failed one unit test. `LST-07` advanced ten fake milliseconds and assumed the list had loaded; on the slower runner it was still showing its skeleton (`dfc4858`). The same pattern was in `DET-11`, found by searching for it and fixed before it failed (`77df30a`). Separately, the axe spec waited a fixed 1.5 seconds; it now waits for animations to end, and my first version of that wait failed intermittently because a cancelled price flash rejects `finished` (`ebf03f0`). All three now wait for a real condition. I could not reproduce the `LST-07` failure locally, so that fix rests on the CI output, not on a reproduction, and the green runs since then support it.

## 10. Checks that checked nothing

Two checks written in Phase 6 and 7 passed vacuously until a negative control showed it. The Arabic spec's "each detail starts on its title's edge" measured a child element that does not exist (the value is the element itself), so every row was skipped and the check could not fail; fixed, then shown to fail when the values are floated away (`7034639`). The keyboard checks (`83d8669`) were each run against a deliberately broken page: a removed focus ring and an `aria-live` around the list. The same habit gave the reduced-motion and 320 px checks in `d75e3f6`. **Lesson:** every new check gets one run against a broken version before it is trusted.

## 11. A bug the screenshots showed

Generating the README screenshots showed ".Apple Inc" in the Arabic watchlist: an English name ending in a full stop takes the direction of the right-to-left paragraph around it, so the stop jumped to the wrong end. No test had looked at this. It is fixed with `<bdi>`, covered by component tests and by a browser measurement that fails with a plain `span` (`44e61f4`).

## 12. Documentation drifts

The ADRs were written as decisions were made and then not touched. Reviewing each against the final code in Phase 7 found ADR 0006 naming tokens that do not exist (`text-primary`, `border` instead of `content`, `line`) and ADR 0007 describing a chart port without `applyLocale` and a bundle problem that ADR 0009 had since settled (`bf1b22b`). **Lesson:** documentation written by an AI, like any other output, needs a review against the thing it describes; the ADRs now have an index and an Amendments convention.

## 13. Configuration that fails quietly

Deploying produced two failures that no test in the repository could see. Railway's default build ran `pnpm --filter @nabd/server build` and skipped Turborepo, so the shared package was never built (`Cannot find module '@nabd/shared'`). Vercel served a blank page because `VITE_API_URL` was entered without `https://`; the app's startup validation caught it, but the user saw an empty page. Both were diagnosed from the platform log and the browser console, and the fixes are recorded in `docs/deployment.md`. A readable error screen for a bad configuration is not built yet (see the README, "What I would do next").

## Patterns across the cases

- The mistakes that cost the most were not syntax errors; they were confident assumptions: that a rule would fit, that a test was testing something, that a change would help, that a wait was long enough.
- What caught them was always something external to the agent's own reading of its code: a failing test, a linter, a real browser, axe, a measurement, a second platform, or a person looking at the screen.
- Tooling in the shell was also a source of small errors. Quoting backticks and `$` in large heredocs and `node -e` strings corrupted generated files several times, so files are written with the editor tools instead (a working note from the session, not visible in git; `TODO(confirm)`).
