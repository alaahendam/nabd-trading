---
description: Add an Architecture Decision Record in docs/decisions/
argument-hint: <short decision title>
---

Add an ADR for: $ARGUMENTS

1. List `docs/decisions/` and use the next free number (zero-padded to four digits). `0000-template.md` is the template and is never edited.
2. Create `docs/decisions/NNNN-<kebab-title>.md` from the template: Status, Date (today), Context, Decision, Alternatives considered, Consequences.
3. Keep it to one page. State the constraint that forced the decision and what we accept as a result. Link related ADRs.
4. If it supersedes an earlier ADR, update that ADR's status to `superseded by NNNN`.
5. Run `pnpm format`. Commit with `docs: add ADR NNNN <title>`, together with the change it explains when there is one.
