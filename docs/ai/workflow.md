# How we work with AI

Claude Code works on this repo under the agreement in `CLAUDE.md`. The plan lives in `docs/PLAN.md`. This file describes the loop.

## The loop

1. **Plan.** Decisions and phase order are written down in `docs/PLAN.md` before any code. A change of direction updates the plan (and an ADR) first.
2. **Build one phase.** A phase is started with one prompt (`/phase <n>`), does only that phase, and stops. Code never gets ahead of the repo, configs and gates that Phases 0 and 1 provide.
3. **Matrix, code, tests.** For each module the test matrix is written first in `docs/testing/<module>.md` (`/test-matrix`), then the code, then the tests, until every case is covered.
4. **Gates.** `/gates` runs format check, lint, typecheck, tests with coverage thresholds, and build. The same gates run in git hooks and again in CI.
5. **Review.** The human reads `git log` and each diff before the next phase starts. Findings are fixed in the same phase.
6. **Commit.** One Conventional Commit per feature or addition, with its tests, leaving the repo green. Never one commit per file, and never a whole phase in one commit.

## Guardrails

- Rules are enforced by tooling, not by instructions: ESLint (boundaries, restricted imports, design-system and i18n rules), Stylelint, Prettier, commitlint, hooks and CI.
- Inline `eslint-disable` comments are ignored by config. `--no-verify`, `@ts-ignore` and lowered coverage thresholds are not used. If a rule is wrong, the work stops and the rule change is proposed with a reason.
- Decisions that surprise a newcomer go into an ADR (`/adr`), not into code comments.

## Project commands (`.claude/commands/`)

| Command                 | Purpose                                               |
| ----------------------- | ----------------------------------------------------- |
| `/phase <n>`            | Implement one phase of the plan, then stop and report |
| `/test-matrix <module>` | Write the test matrix for a module before its code    |
| `/adr <title>`          | Add an Architecture Decision Record                   |
| `/gates`                | Run every quality gate and report                     |

## Prompts

Curated prompts, adapted to English, are kept in `docs/ai/prompts/`. `docs/ai/PHASE-0-PROMPT.md` is the prompt that started this repo's setup.
