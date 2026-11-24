# 0006. Design tokens: semantic only, default palette removed

- Status: accepted
- Date: 2026-11-24

## Context

The design system rules say all visual values come from tokens (primitives, then semantic tokens), dark and light swap only the semantic layer, components use semantic utilities only, and ESLint rejects unknown classes, arbitrary values and color literals. The product has a brand palette (forest, ink, canvas, sage, lime, amber) but market up and down colors must stay distinct from the brand green and readable without color alone.

## Decision

- `tokens.css` is the single file with color literals. It holds **primitives** (the raw palette and neutral scales) and **semantic tokens** (`surface`, `surface-raised`, `surface-sunken`, `text-primary`, `text-muted`, `border`, `brand`, `accent`, `positive`, `negative`, `watch`, `focus`, ...). The light theme is the default; `[data-theme='dark']` redefines only the semantic layer.
- Tailwind v4 maps utilities to the semantic tokens with `@theme inline`, and the default color palette is removed (`--color-*: initial`). A utility such as `bg-blue-500` therefore does not exist, and the `no-unknown-classes` lint rule rejects it. Components can only express intent (`bg-surface-raised`, `text-muted`).
- The theme is `light`, `dark` or `system` (default), persisted in `localStorage`. A small inline script in `index.html` sets `data-theme` before first paint to avoid a flash. The app keeps it in sync with the system setting while the preference is `system`.
- Up and down use a green and a red that are not the brand green, and each is paired with a sign or arrow in the UI (never color alone).
- A test parses `tokens.css` and checks the WCAG AA contrast of every text/background pair that the UI uses, in both themes, so a palette edit cannot silently break accessibility.
- Fonts are IBM Plex Sans and IBM Plex Sans Arabic from Fontsource (self-hosted, no third-party request), with tabular numerals for numbers that change.

## Alternatives considered

- **Keep Tailwind's default palette beside the tokens.** Rejected: it invites raw colors and makes the lint rule unable to enforce the design system.
- **A `dark:` variant on every component.** Rejected: duplicates every color decision in markup; swapping variables once in CSS is simpler and cannot drift.
- **Google Fonts.** Rejected: a third-party request on every page load and a layout shift risk, for fonts that are available as packages.

## Consequences

- Adding a color means adding a token (and its dark value) in one place, then a mapping line in the theme.
- Anything not in the token set is a lint error, which is the intended friction.
- The contrast test must be extended when a new text/background pairing is introduced.
