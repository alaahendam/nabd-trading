# Phase 0 prompt

Paste this as the first message to Claude Code, started inside this repo.

---

Read `CLAUDE.md` and `docs/PLAN.md` fully before doing anything.

Your task is **Phase 0 only: repository and workspace setup, with no application code.** The repo folder, `CLAUDE.md`, `docs/PLAN.md`, `.gitignore`, `.editorconfig`, `.gitattributes`, `pnpm-workspace.yaml` and a minimal root `package.json` already exist. Build on them. The `.vscode/` and `.claude/` folders do NOT exist yet (they could not be pre-created), so create them yourself: `.vscode/settings.json` (format on save with Prettier, ESLint and Stylelint fix on save, LF endings, flat ESLint config, workspace TypeScript SDK) and `.vscode/extensions.json` (Prettier, ESLint, Stylelint, Tailwind CSS IntelliSense, EditorConfig, Vitest). The `.gitignore` already keeps those two `.vscode` files tracked and ignores `.claude/settings.local.json`.

1. Check the environment first (`node -v`, whether pnpm is available via corepack). Pin Node (`.nvmrc` and `engines`) and pnpm (`packageManager`) to the versions actually installed. Run `git init` if needed and make the default branch `main`.
2. Set up Turborepo with pipelines for `build`, `dev`, `lint`, `typecheck`, `test`, `format:check`.
3. Create `packages/config` with shared base `tsconfig`s (strict, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`), ESLint flat configs (base, react, node), a Prettier config with the Tailwind class-order plugin, and a Stylelint config.
4. Encode every rule from section 4 of `docs/PLAN.md` as real configuration, even where the code it targets does not exist yet (boundaries, restricted imports, design-system rules, i18n literal-string rule, logical-properties rules). Use `--max-warnings 0`.
5. Add husky, lint-staged (pre-commit), commitlint with Conventional Commits (commit-msg), and a pre-push hook for typecheck and tests.
6. Add a GitHub Actions workflow: frozen-lockfile install, format check, lint, typecheck, test, build.
7. Add `.claude/` with project commands you find useful (for example a command that creates a test matrix and a command that adds an ADR), and fill `docs/ai/workflow.md` describing how we work: plan, build one phase, review, commit.
8. Make the root `README.md` skeleton accurate and add the root scripts (`dev`, `build`, `lint`, `typecheck`, `test`, `format`, `format:check`).

Gate before you stop:

- `pnpm install`, `pnpm lint`, `pnpm typecheck`, `pnpm format:check` all pass on the empty workspace.
- Prove the enforcement works: create temporary throwaway files that violate, one at a time, a formatting rule, a hex color literal, an arbitrary Tailwind value, a physical-direction class (`ml-4`), a literal string in JSX, a cross-feature import, and a bad commit message. Show that each one is rejected, then delete the throwaway files. If a rule cannot be demonstrated yet because its target code does not exist, say so explicitly and list it so it is re-checked in Phase 1.
- Commit as you go, one logical unit per commit (for example: workspace and Turborepo, TypeScript bases, Prettier, ESLint base, each ESLint rule group, Stylelint, husky and lint-staged, commitlint, CI workflow, `.vscode`, `.claude` and AI docs, README). Stage files explicitly, never batch the phase into one commit, and make sure each commit leaves the repo passing. Then stop and give me a short report: what was set up, what was verified, what is deferred to Phase 1. Do not start Phase 1.
