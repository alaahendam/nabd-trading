# Prompts

The prompts that drove this repo, in the order they were used. The user's own messages were short; what made them work is the standing context (`CLAUDE.md`, `docs/PLAN.md`, the `.claude/commands`). Files marked **Adapted from the original conversation** keep the meaning and are cleaned up (spelling, structure, rough wording); none adds requirements the original did not have.

| File                                             | What it is                                                   |
| ------------------------------------------------ | ------------------------------------------------------------ |
| [00-phase-0.md](00-phase-0.md)                   | The Phase 0 prompt (original, not adapted)                   |
| [01-phase-start.md](01-phase-start.md)           | How Phases 1 to 5 were started, and what `/phase` adds       |
| [02-design-polish.md](02-design-polish.md)       | The design round before Phase 6                              |
| [03-phase-6-closeout.md](03-phase-6-closeout.md) | Closing out Phase 6: CI, flakiness, bundle, a11y, Arabic E2E |
| [04-deployment.md](04-deployment.md)             | Deploying to Vercel and Railway                              |
| [05-phase-7.md](05-phase-7.md)                   | This documentation phase                                     |

Phase 6 itself was started with "Start Phase 6" and resumed with "Resume Phase 6" after the design round; its scope is in `tasks/plan.md`.
