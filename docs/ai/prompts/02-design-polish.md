# Design polish round (between Phase 5 and Phase 6)

> **Adapted from the original conversation.** The original was one run-on message with a screenshot, written quickly. It is split into a list here with the meaning unchanged. The agent answered with three clarifying questions; the user's answers are included.

Before continuing with Phase 6, the design needs these changes:

1. **Light theme:** the colors need to be sharper.
2. **Navbar:** switching between themes should be a select box, and the same for the language. Add a flag or an icon to the language select.
3. **Logo:** design a logo instead of the plain text.
4. **Footer:** remove the "TradingView Lightweight Charts™ · Copyright © 2025 TradingView, Inc." line, or, if keeping it is the best practice, keep it but make it small and better styled.
5. **Chart time axis:** the horizontal time labels show Arabic digits. They should follow the language: Arabic in Arabic, English in English.
6. **Stock page in Arabic:** details such as "Open" do not line up with their own titles.
7. **Periods (1D, 1M and so on):** add a "from, to" option so the user can choose a dynamic date range.
8. **Stocks page:** add pagination with scrolling.
9. **Stars:** the mouse should turn into a pointer.

Clarifying questions asked and answered:

- Axis digits: **Latin digits with Arabic month and day names** (the recommended option).
- Pagination: **infinite scroll with server-side pages** (the recommended option).
- Date range: **full, the server accepts `from` and `to`** (the recommended option).

Result: `tasks/design-polish.md` (seven tasks, D1 to D7), ADR 0008, and the commits from `40166b8` to `555a2be`.
