# CLAUDE.md and the `.claude` commands

Two things configure the agent for this repository. Both are checked in, so the next person (or the next session) gets the same agent behavior.

## `CLAUDE.md`: the working agreement

Read automatically by Claude Code at the start of every session. It is the standing context that the one-line phase prompts rely on. It says:

- **How to work:** phase by phase from `docs/PLAN.md`; matrix, then code, then tests; stop and report at the end of a phase; never bypass a rule; say so when the plan and the request disagree.
- **The stack and the package names.**
- **Architecture rules**, which ESLint enforces: import direction, public `index.ts` per feature, where network access may live, live prices in an external store, naming.
- **Design-system rules:** tokens only, logical properties only, every string through i18n, Latin digits, every state designed.
- **Quality gates** and **commit rules** (Conventional Commits, one commit per piece of work, explicit staging, never generated files or secrets).

It does not describe the code (the code and the ADRs do that), and it does not duplicate the plan. When a rule in it is wrong, the change is proposed first, then made (for example, the kebab-case naming rule was added when the structure was reorganized in Phase 5).

## `docs/PLAN.md`

The locked decisions and the execution order, written before any code. Phases are executed from section 6. It is a plan, so parts of it are superseded by ADRs (for example, ADR 0002 replaced Jest with Vitest on the server).

## `.claude/commands/`: the four project commands

Each is a prompt file that turns a short instruction into the same procedure every time.

| Command                 | What it does                                                                                                                                                                                                                             |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/phase <n>`            | Implements exactly one phase of the plan: reads `CLAUDE.md` and the plan, checks the previous phase is committed and green, writes matrices before code, commits in small green steps, runs the gates, then stops and reports.           |
| `/test-matrix <module>` | Writes `docs/testing/<module>.md` before any code: purpose, a table of cases with IDs (happy path, boundaries, invalid input, error paths, UI states, RTL and dark mode, time and randomness), coverage target and what is out of scope. |
| `/adr <title>`          | Adds the next numbered ADR from the template, in `docs/decisions/`, and updates the status of an ADR it supersedes.                                                                                                                      |
| `/gates`                | Runs format check, lint, typecheck, test and build in order and stops at the first failure to fix the cause, never the rule.                                                                                                             |

How they were used: the transcript shows the phases started with plain messages ("Start Phase 4"), not with `/phase 4`; the commands encode the same procedure, and the agent followed it either way.

## Skills

They were installed in the user's Claude Code skills folder (from the open-source `addyosmani/agent-skills`) and load by description, so they are listed per phase in `prompts/01-phase-start.md`. Verbatim copies of the 13 that were used are in [`.claude/skills`](../../.claude/skills), with the files they link to, the licence and where they came from in [`.claude/skills/UPSTREAM.md`](../../.claude/skills/UPSTREAM.md). They are third-party, not my work.
