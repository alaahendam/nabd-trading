# Design polish round (between Phase 5 and the rest of Phase 6)

Requested by the user after seeing the app. Decisions confirmed with them: the chart axis keeps **Latin digits** with Arabic month and day names in Arabic mode; the stock list gets **infinite scroll with server-side pages**; the chart gets a **custom from and to range with server support**. Working agreement: `CLAUDE.md`. The Phase 6 plan (`tasks/plan.md`) resumes after this.

## Decisions

- **Native selects, not a custom listbox.** Theme and language become `<select>` elements with a leading icon. A native select is keyboard, screen reader and mobile friendly for free; a custom listbox would have to reproduce the whole ARIA pattern. The icon sits beside the control (an SVG inside a native option cannot render). For language the icon is a globe, not a flag: a language is not a country, and Arabic has no single flag.
- **Logo.** An SVG mark (a heartbeat line turning into rising candles, lime on forest, from the plan) next to the translated wordmark. The mark is decorative; the link to the home page carries the name.
- **Footer attribution stays.** The chart library's license requires the notice and a link on a visible page, so it is kept, but small, muted and tidy rather than removed.
- **Sharper light theme** means higher contrast and cleaner edges, not new brand colors: a darker muted text, stronger borders and grid lines, more saturated market colors, a card edge around the chart and stats. Every pairing stays covered by the contrast test.
- **Chart axis follows the app language.** The chart gets a locale; ticks and the crosshair are formatted with `Intl` using `-u-nu-latn`, so digits stay Latin and month and weekday names follow the language.
- **Stat alignment in RTL.** The figures are left-to-right isolates, which made them align to the left of their cell while their labels aligned right. The numeric utility becomes an inline block, so the parent's direction places it.
- **Pointer cursor on buttons** as a base style (Tailwind 4 no longer sets it).
- **Custom range API.** `GET /stocks/:symbol/history` accepts either `period` or `from` and `to` (milliseconds). The candle size is chosen from the span with the same tiers as the fixed periods, the span is capped at one year, and `to` may not be in the future. The response carries `bucketMs` so the live candle uses the right width for any range.
- **Stock list pages.** `GET /stocks` accepts `limit` and `cursor` and answers with `nextCursor`, and a `symbols` filter (used by the watchlist, no paging). The web list is an infinite query; an observer on a sentinel row loads the next page, and only loaded rows are subscribed to live prices.

## Tasks

- [x] D1: small fixes: pointer cursor, RTL stat alignment, smaller footer attribution
- [x] D2: sharper light theme (tokens, chart card, contrast test)
- [x] D3: theme and language selects with icons
- [x] D4: the logo
- [ ] D5: chart axis and crosshair in the app language
- [ ] D6: stock list pagination with infinite scroll (shared, server, web)
- [ ] D7: custom date range for the chart (shared, server, web)

Each task: test matrix first where behavior changes, tests, code, gates, one commit, and a look in the real browser for the visual ones.
