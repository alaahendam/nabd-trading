# End-to-end: test matrix

Scope: `apps/web/e2e`. A real Chromium against the real built server and web app, started by Playwright on dedicated ports (API 3300, web 4273). Each test gets a fresh browser context, so a fresh client ID and an empty watchlist. Prices are random: tests wait for a change and never expect a number.

Run: `pnpm --filter @nabd/web test:e2e`. CI runs it as its own job and keeps the report when a test fails.

## Main flow (`main-flow.spec.ts`)

| ID     | Behavior                              | Steps                                                                                                                                   | Expected                                                                                                                        |
| ------ | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| E2E-01 | Live list to watchlist, two languages | open the list, wait for a price change, open AAPL, switch period, star it, open the watchlist, reload, switch to Arabic, reload, unstar | "21 stocks" and Live; the chart is named with the period; the star and the watchlist survive a reload; Arabic, RTL, kept; empty |
| E2E-02 | Custom range                          | open MSFT, Custom, fill two dates, Apply                                                                                                | the chart is named with the dates and Custom is pressed                                                                         |

## States (`states.spec.ts`)

| ID     | Behavior         | Steps                                         | Expected                                               |
| ------ | ---------------- | --------------------------------------------- | ------------------------------------------------------ |
| E2E-03 | Server failure   | abort the list request, then restore it       | an error after the retries; "Try again" loads the list |
| E2E-04 | Offline and back | the browser goes offline, then online         | the banner says Offline, then Live again               |
| E2E-05 | Reduced motion   | emulate `prefers-reduced-motion: reduce`      | transitions and animations are effectively zero        |
| E2E-06 | 320 px screen    | each page and the custom range form at 320 px | the page does not scroll sideways                      |

Each check was shown to be able to fail: without the emulation the transitions are real, and the overflow measurement reports a deliberately wide element.

## Arabic and keyboard

| ID     | Behavior                 | Steps                                                                      | Expected                                                                                                                                                        |
| ------ | ------------------------ | -------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| E2E-09 | Arabic on the stock page | open AAPL, switch the language to Arabic                                   | `dir=rtl`, the chart keeps `dir=ltr` and is described in Arabic, no Arabic-Indic digits, the logo is right of the selector, details start on their title's edge |
| E2E-10 | Tab order on every page  | press Tab to the end of each page                                          | skip link first, a name and a focus indicator at every stop, no trap, the footer link last                                                                      |
| E2E-11 | Keyboard actions         | skip link, open a stock, star with Space, periods, custom range with Enter | focus moves to `main`, the page opens, the star toggles, the period and range apply                                                                             |
| E2E-12 | Prices and live regions  | watch the list while a price changes                                       | no price is inside a live region, and nothing containing a price is announced                                                                                   |

## Accessibility (`accessibility.spec.ts`)

| ID     | Behavior               | Steps                                                                                               | Expected                                |
| ------ | ---------------------- | --------------------------------------------------------------------------------------------------- | --------------------------------------- |
| E2E-07 | WCAG A and AA with axe | `/stocks`, a stock, `/watchlist` and the not-found page, each in light and dark, English and Arabic | no violations (tags wcag2a to wcag22aa) |
| E2E-08 | Custom range form      | an invalid range applied, so the error shows                                                        | no violations                           |

Axe found two real problems when first run, both fixed in the product and not excluded: the period buttons were named "Past week" while showing "1W" (they are now "1W, Past week"), and the TradingView link inside the chart made interactive content sit inside an image (the chart is now a labelled figure).
