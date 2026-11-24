---
description: Implement exactly one phase of docs/PLAN.md, then stop and report
argument-hint: <phase number>
---

Implement **Phase $ARGUMENTS only** from section 6 of `docs/PLAN.md`.

1. Read `CLAUDE.md` and `docs/PLAN.md` fully. If the plan and this request disagree, say so and ask before building.
2. Check that the previous phase is committed and its gates are green. If not, stop and report.
3. For each module in the phase: write `docs/testing/<module>.md` first (`/test-matrix`), then the code, then the tests, until the matrix is fully covered.
4. Commit one logical unit at a time with Conventional Commits. Stage files explicitly, review `git diff --staged`, and leave the repo green at every commit.
5. Run `/gates`.
6. Stop and report: what was built, what was verified, what is deferred. Do not start the next phase.
