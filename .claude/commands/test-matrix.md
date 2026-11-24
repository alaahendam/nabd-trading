---
description: Write the test matrix for a module before any code (docs/testing/<module>.md)
argument-hint: <module name, e.g. price-simulator>
---

Create `docs/testing/$ARGUMENTS.md`. Read `CLAUDE.md` and `docs/PLAN.md` (sections 5 and 6) first.

The matrix lists every case the module's tests must cover, before the code exists:

1. **Purpose and public surface**: what the module does and which functions, classes or endpoints are tested.
2. **Cases table** with columns `ID | Area | Case | Input / setup | Expected | Level (unit / integration / e2e / component)`.
   Cover the happy path, boundaries, invalid input, error and retry paths, empty and loading states (UI), RTL and dark mode (UI), and anything time- or randomness-dependent (use seeded or fake clocks).
3. **Coverage target**: 100% for domain logic (price simulator, history generator, watchlist service, realtime store, formatters), at least 90% otherwise. Name anything excluded and why.
4. **Out of scope** for this module.

Rules: no code in this step. Number cases `<PREFIX>-01...` so tests can reference them in their `it(...)` titles. Format with `pnpm format`. Commit the matrix together with the module it describes, never alone and never after.
