# How this repo was built with AI

This is the real workflow, written from the repository, its git history and the Claude Code transcripts. Where a fact cannot be verified from those, it is marked `TODO(confirm)`.

Related: [`lessons.md`](lessons.md) (where AI output was wrong and how it was caught), [`prompts/`](prompts/README.md) (the prompts), [`claude-config.md`](claude-config.md) (what `CLAUDE.md` and each `.claude` command are for).

## The short version

Plan in chat, build one phase at a time in Claude Code under a written agreement, make the tooling reject bad work instead of relying on review, and prove every claim with a test, a measurement or a real browser. The human decided scope, challenged choices and looked at the running app; the AI wrote almost all the code and tests, and had to pass the same gates a person would.

## 1. Planning in Claude chat

The plan existed before any code. The baseline commit (`d216cbc`, the first in the history) contains `docs/PLAN.md` (locked decisions, design direction, enforcement, testing policy, execution order), `CLAUDE.md` (the working agreement) and the Phase 0 prompt, and no application code. The user describes this planning as done in a Claude chat conversation; `TODO(confirm)`: that chat is not part of this repository, so what was decided there versus in Claude Code cannot be shown here.

## 2. Preparing the agent

Before the project, the user evaluated and installed engineering skills from the open-source `addyosmani/agent-skills` repository into the Claude Code skills folder. The transcript shows the order: asking whether the skills were worth using and safe, asking for a scan for anything suspicious, then installing. The skills used on this project, by phase, are in [`prompts/01-phase-start.md`](prompts/01-phase-start.md).

## 3. Implementation in Claude Code, phase by phase

- One phase at a time, from section 6 of `docs/PLAN.md`: tooling and gates first (Phases 0 and 1), then the shared contracts (2), the server (3), the web foundation (4), the features (5), and polish, tests and accessibility (6). Phase 7 is documentation.
- A phase starts with a short message from the user ("Start Phase 4"). The agent reads the plan and `CLAUDE.md`, writes a short plan for the phase (the `docs: plan Phase N` commits, and `tasks/` for Phase 6), then works through it.
- For each module the test matrix is written first (`docs/testing/<module>.md`), then the code, then the tests until every row is covered. The matrices are still in `docs/testing/`, and test names carry the row IDs (`LST-07`, `CHT-18`, `RTC-24`).
- Commits are small and each leaves the repo green (about a hundred commits, each with a `Co-Authored-By` trailer naming Claude Sonnet 5.5; `TODO(confirm)`: whether every phase ran on that model).
- At the end of a phase the agent stops and reports: what was built, what was verified, what is deferred. It does not start the next phase.

## 4. Review

- **By the agent, before every commit:** `git diff --staged` is read, and the pre-commit hook runs Prettier, ESLint and Stylelint on the staged files.
- **By the human, at phase boundaries and in between:** the transcripts show the user questioning decisions rather than accepting them: why the repo was not created with `create-react-app` or the Nest CLI, whether the agent's choices followed best practice or only the user's words, a list of design problems found by looking at the running app (see `lessons.md`). `TODO(confirm)`: whether every diff was read by the user before each commit.
- **By tooling, always:** see the next section.

## 5. Gates the AI also has to pass

The agent does not get to bypass a check. The rules are in `CLAUDE.md` and enforced by tooling.

- Pre-commit: Prettier, ESLint with `--max-warnings 0`, Stylelint, on staged files. commit-msg: Conventional Commits. Pre-push: typecheck and tests. CI repeats all of it and adds the end-to-end suite on Linux, because hooks can be skipped and CI cannot.
- ESLint encodes the architecture (import boundaries, network access in one place, the chart library behind one file), the design system (tokens only, logical properties, no arbitrary values) and i18n (no literal strings). Inline `eslint-disable` comments are ignored by configuration.
- Coverage thresholds are per directory (100% on domain logic) and are never lowered.
- No `--no-verify`, no `@ts-ignore`. If a rule is wrong, the work stops and the change to the rule is proposed with a reason; the two times a rule blocked valid code, it was narrowed, not turned off (`lessons.md`).

## 6. Proof over assertion

Because the agent can sound sure and be wrong, claims are checked by something that can fail:

- **Tests that can fail.** New checks were run against a deliberately broken version before being trusted (a removed focus ring, a floated value, a plain `span` instead of `bdi`, a live region around the list).
- **Real browsers.** Playwright runs against the real built server and web app, locally and on GitHub; axe checks WCAG A and AA on every page in both themes and languages; the built-in browser was used to look at pages, read the console and measure.
- **Measurement.** Bundle sizes, repeat runs for flakiness (`--repeat-each=5`), and a live-site run of the whole E2E suite against production.
- **Documented decisions.** A surprising choice becomes an ADR in the same commit, and the ADRs were reviewed against the code in Phase 7.

## 7. What stayed with the human

Scope and priorities, every change of direction (the design round, infinite scroll, the custom date range, deploying to Vercel and Railway), the accounts and settings on the hosting platforms, anything that sends data outside the machine, and the release (the tag is created by the user, not the agent).
