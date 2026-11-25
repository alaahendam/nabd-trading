# Phase 7: documentation and release

> **Adapted from the original conversation.** Content unchanged; formatting lightly tidied.

> The marker the original asked for was resolved with the author's answers before the v1.0.0 release, so the repository no longer contains it; the wording below refers to it generically.

Documentation and release. No feature work. Same rules: one commit per addition, every commit green.

0. **Gate first.** Confirm the Phase 6 close-out items are done. If anything is missing, list it and stop before writing docs.
1. **README**, rewritten fully: description, live links, a short "simulated data, independent project" note, 2 to 4 screenshots; a quick start that is exactly right; a scripts table; architecture with a Mermaid diagram and the folder structure; key decisions linking to their ADRs; testing strategy; quality gates; accessibility, i18n and RTL, theming; deployment; honest known limitations; what to do next; how the work was done with AI (link to `docs/ai`).
2. **Screenshots**, generated with Playwright against the local build: list, detail with chart, watchlist; light and dark; English and Arabic; small files under `docs/screenshots`.
3. **ADRs:** review each against the final code, fix what is outdated, add `docs/decisions/README.md` as an index.
4. **AI documentation** in `docs/ai`: the real workflow, the actual phase prompts (cleaned, marked as adapted), concrete lessons from this repo where AI output was wrong or not good enough and how it was caught, and what `CLAUDE.md` and each `.claude` command are for. Do not invent facts; mark anything unsure with a visible marker so the author can confirm it.
5. **Final verification:** clone into a fresh folder, follow the README exactly as written, run every gate plus E2E, fix the README if a step fails. Check for leftover TODOs (other than the confirmation markers), secrets, debug code and unused files.

Then stop and report, including the list of items waiting for confirmation. Do not create the release tag.
