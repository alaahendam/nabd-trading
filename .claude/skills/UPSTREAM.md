# Where these skills come from

The folders next to this file are **copies, made verbatim, of 13 skills from the open-source repository [`addyosmani/agent-skills`](https://github.com/addyosmani/agent-skills)** (MIT licence, copyright Addy Osmani; the licence text is in [`LICENSE`](LICENSE) here). They are not my work. I copied them so that anyone reading this repository can see exactly the instructions the AI agent was given while building it.

- **Source:** `addyosmani/agent-skills` at commit `8c99fa3` (plugin version 0.6.17).
- **What was copied:** the 13 skills I had installed and used while building Nabd, byte for byte as installed (checked identical to that commit before copying):
  `accessibility-engineering`, `api-and-interface-design`, `browser-testing-with-devtools`, `debugging-and-error-recovery`, `frontend-ui-engineering`, `incremental-implementation`, `interview-me`, `performance-optimization`, `planning-and-task-breakdown`, `security-and-hardening`, `source-driven-development`, `spec-driven-development`, `test-driven-development`.
- **Files they link to:** the skills point at five checklists and one agent file outside their own folders. Those are copied too, unchanged, so the links work: `../references/` (`accessibility-checklist`, `definition-of-done`, `performance-checklist`, `security-checklist`, `testing-patterns`) and `../agents/accessibility-auditor.md`.
- **Not copied:** the other 13 skills in the upstream repository (for example code review, git workflow, ADRs and CI). A few of the copied skills mention them by name in their text; those mentions are not links and nothing here depends on them.
- **Formatting:** these folders are excluded from Prettier (see `.prettierignore`) so the files stay identical to upstream. Do not reformat them; update them by copying from upstream again.

## How they were used

Claude Code loads a skill by its description when a task matches. Which ones were loaded in which phase is listed in [`docs/ai/prompts/01-phase-start.md`](../../docs/ai/prompts/01-phase-start.md), and how the rest of the agent setup works is in [`docs/ai/claude-config.md`](../../docs/ai/claude-config.md). Before installing them I had them reviewed for anything suspicious (see [`docs/ai/workflow.md`](../../docs/ai/workflow.md)).
