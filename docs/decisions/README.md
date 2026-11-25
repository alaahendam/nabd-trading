# Architecture decision records

Decisions that would surprise a newcomer, each with the constraint that forced it, the alternatives that were rejected, and what is accepted as a result. New ones start from [`0000-template.md`](0000-template.md) (the `/adr` command in `.claude/commands/` does the numbering).

| #                                                           | Decision                                                                   | Status   |
| ----------------------------------------------------------- | -------------------------------------------------------------------------- | -------- |
| [0001](0001-toolchain-version-holds.md)                     | Hold TypeScript, ESLint and Stylelint below their latest major             | accepted |
| [0002](0002-server-tests-with-vitest.md)                    | Test the server with Vitest, not Jest                                      | accepted |
| [0003](0003-in-memory-watchlist.md)                         | Keep the watchlist in memory behind a repository interface                 | accepted |
| [0004](0004-market-simulation-design.md)                    | Market simulation design (seeded, stateful live prices, pure history)      | accepted |
| [0005](0005-no-redux-live-prices-in-external-store.md)      | No Redux: server state in TanStack Query, live prices in an external store | accepted |
| [0006](0006-design-tokens-and-theming.md)                   | Design tokens: semantic only, default palette removed                      | accepted |
| [0007](0007-chart-behind-a-port-and-feature-composition.md) | The chart behind a port, and how the features fit together                 | accepted |
| [0008](0008-paged-stock-list-and-custom-history-range.md)   | A paged stock list and a custom history range                              | accepted |
| [0009](0009-route-splitting-measured-and-not-kept.md)       | Route splitting was measured and not kept; vendor chunks instead           | accepted |

Statuses are `proposed`, `accepted`, or `superseded by NNNN`. An ADR that stays right but gains later facts has an **Amendments** section (see 0007) instead of being rewritten, so the history of the decision stays readable.

The last full review of every ADR against the code was in Phase 7 (2026-11-25). It fixed the token names in 0006 and brought 0007 up to date.
