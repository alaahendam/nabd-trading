# 0001. Hold three tools below their latest major

- Status: accepted
- Date: 2026-11-24

## Context

Phase 0 installed the current release of every tool. Some of the lint plugins that enforce our rules do not support the newest majors of their host tools yet, and `pnpm peers check` reports unmet peers for them.

| Tool       | Latest | Held at | Blocked by                                                                            |
| ---------- | ------ | ------- | ------------------------------------------------------------------------------------- |
| TypeScript | 7.x    | 6.0     | typescript-eslint supports `>=4.8.4 <6.1.0`                                           |
| ESLint     | 10.x   | 9.x     | eslint-plugin-react and eslint-plugin-jsx-a11y support up to 9                        |
| Stylelint  | 18.x   | 17.x    | stylelint-use-logical supports `>=11 <18`, so stylelint-config-standard is held at 40 |

## Decision

Pin the held versions and keep `pnpm peers check` clean. The enforcement rules in `CLAUDE.md` matter more than being on the newest major.

## Alternatives considered

- **Latest of everything, ignoring peer warnings.** Rejected: unsupported plugin combinations can fail silently, which defeats rules that exist to be trusted.
- **Drop the blocking plugin.** Rejected: each one enforces a rule we committed to (a11y, RTL logical properties, React linting).

## Consequences

- We miss the newest features until the plugins catch up. Re-check each hold when a plugin releases support, and upgrade the tool and plugin together in their own commit.
- `pnpm peers check` is a useful signal during upgrades.
