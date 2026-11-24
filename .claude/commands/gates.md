---
description: Run every quality gate and report the result
---

Run, in order, and stop at the first failure to fix the cause (never the rule):

1. `pnpm format:check`
2. `pnpm lint`
3. `pnpm typecheck`
4. `pnpm test`
5. `pnpm build`

Report each gate as pass or fail with the failing output. Do not use `--no-verify`, `eslint-disable`, `@ts-ignore`, or lower a coverage threshold. If a rule looks wrong, stop and propose the change with a reason.
