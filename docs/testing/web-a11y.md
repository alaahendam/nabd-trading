# Accessibility: keyboard pass and screen reader notes

Scope: how the app behaves for someone who does not use a mouse or does not see the screen. The automated part lives in `apps/web/e2e/keyboard.spec.ts` (and `accessibility.spec.ts` for axe, see `web-e2e.md`); this page is what it checks, what it found, and what it cannot tell us.

## What was checked, page by page

The pass presses Tab until focus leaves the page, on `/stocks`, `/stocks/AAPL`, `/watchlist` and `/no-such-page`. For every stop it checks a name a screen reader can say, and a drawn focus indicator (an outline or a ring). Reaching 120 presses fails the test, which is how a focus trap would show up.

| Page            | Tab order found                                                                                                                                 |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| every page      | Skip to content, logo link, Stocks, Watchlist, Theme (select), Language (select), then the page, then the TradingView notice link in the footer |
| `/stocks`       | each stock link followed by its star button (Watch AAPL, ...), then "Load more stocks"                                                          |
| `/stocks/AAPL`  | the star (Watch AAPL), the five period buttons, Custom, the "Charting by TradingView" link the chart library draws, then the footer             |
| `/watchlist`    | Browse stocks (the empty state's action)                                                                                                        |
| `/no-such-page` | Back to stocks                                                                                                                                  |

Results, all passing:

- The skip link is the first stop, and Enter moves focus to `main` (which has `tabindex="-1"` for this).
- No page traps focus; the order follows the visual and reading order (checked in English; the Arabic layout is checked for mirroring in `arabic.spec.ts`, not for tab order).
- Every stop has a name and a focus indicator. The one stop that first had no text, the chart library's attribution link, is named by its `title`.
- A stock opens with Enter; the star toggles with Space (`aria-pressed`); the periods work with Enter; Custom opens with Space, and Enter inside a date field submits the form and closes it.
- A star is disabled until the watchlist has loaded, and a disabled button is skipped by Tab. That is correct (it cannot be used yet) and short; the tests wait for it to be enabled.
- Both selects (theme, language) are native `select` elements, so arrows, type-ahead and the platform picker come for free. Changing the language by selecting it is covered in the main flow.

Negative controls: a focus ring removed with CSS is caught by the indicator check, and a live region put around the list is caught by the live-region check.

## Live prices and screen readers

Prices change many times a second across a list, so announcing them would make the page unusable with a screen reader. The page is built so nothing announces a tick:

- The only live regions on the pages are the connection status (`role="status"`: "Live", "Offline", ...), which changes when the connection does, and the transient statuses and alerts for loading, empty states and errors. A price is never inside one (`price sits in a live region` checks every `data-direction` element against every `aria-live`, `status`, `alert` and `log`).
- While prices change on screen, a `MutationObserver` over the live regions records nothing that contains a price (`prices keep ticking without a single announcement`).
- The flash and the up or down arrow are visual cues next to text that already says the change in words and a sign, so color is never the only signal.
- The chart's description comes from the loaded history, not from ticks, so it is still while prices move.

A user who wants the current price reads it by moving to it; nothing interrupts them.

## What this does not cover

- No real screen reader (NVDA, JAWS, VoiceOver, TalkBack) was run. The checks read the accessibility tree and the DOM, which is what screen readers use, but how a name or a description is spoken, and the order of announcements, can only be judged by listening.
- Focus order and indicators were observed in Chromium only.
- Colour contrast and the rest of WCAG A and AA are axe's job (`accessibility.spec.ts`); axe cannot judge whether a description is a good description.
- The Arabic text was written by the assistant and reviewed by the project author. It has not been through a professional translation or localization review.
