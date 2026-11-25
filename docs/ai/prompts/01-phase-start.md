# Starting a phase (Phases 1 to 5)

> **Adapted from the original conversation.** The wording below is the user's, lightly corrected (spelling and grammar only). The detailed scope of each phase is not in these messages: it lives in section 6 of `docs/PLAN.md`, in the plan written at the start of the phase (`docs: plan Phase N` commits, and `tasks/`), and in the `/phase` command.

Phases 1 to 5 were each started with a one-line message to Claude Code:

| Phase | Message (corrected)                                                                                                                               |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1     | "Yes, use your skills here and let's start Phase 1."                                                                                              |
| 2     | "Great, let's start Phase 2."                                                                                                                     |
| 3     | "Let's start on Phase 3."                                                                                                                         |
| 4     | "Start Phase 4."                                                                                                                                  |
| 5     | "OK, we move forward to Phase 5. I have some points I want to discuss with you first." (the structure and naming discussion, see `../lessons.md`) |

What turns a one-line message into a bounded piece of work is the standing context, and in particular `.claude/commands/phase.md`, which says what to do:

1. Read `CLAUDE.md` and `docs/PLAN.md` in full; if they disagree with the request, say so and ask.
2. Check that the previous phase is committed and green.
3. For each module: the test matrix first (`docs/testing/<module>.md`), then the code, then the tests.
4. One logical commit at a time, staged explicitly, `git diff --staged` reviewed, the repo green at every commit.
5. Run the gates, then stop and report what was built, what was verified and what is deferred. Do not start the next phase.

The skills below were loaded at the start of each phase (taken from the transcript):

| Phase | Skills loaded                                                                      |
| ----- | ---------------------------------------------------------------------------------- |
| 1     | planning-and-task-breakdown, incremental-implementation, source-driven-development |
| 2     | api-and-interface-design, test-driven-development                                  |
| 3     | security-and-hardening                                                             |
| 4     | frontend-ui-engineering                                                            |

The skills come from the open-source `addyosmani/agent-skills` repository; the user had them reviewed for anything suspicious before installing them (see `../workflow.md`).
