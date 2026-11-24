# 0008. A paged stock list and a custom history range

- Status: accepted
- Date: 2026-11-24

## Context

After the Phase 5 features were in use, two requests changed the API: the stock list should load page by page as the user scrolls, and the chart should accept a custom from and to date range next to the fixed periods (1D to 1Y). Both had to stay compatible with what already existed and keep the server's rule that anything it serves is deterministic.

## Decision

**Paging the list.** `GET /api/stocks` accepts `limit` and `cursor`. The cursor is the last symbol of the previous page, so it needs no encoding and stays valid while the list does not change. The response carries `nextCursor` (a symbol, or `null` at the end) and `total`, so the header can say "21 stocks" before everything is loaded. Without a `limit` the whole list comes back, so a caller that does not know about paging keeps working. A `symbols` filter returns just those stocks in list order and is not paged, which is what the watchlist needs; it never has to walk pages to find its stocks. An unknown cursor or malformed input is a 422.

**The scroll.** The web list is an infinite query. The only thing observed is the "Load more stocks" button: it is a real button, so the keyboard and screen readers can load more, and it also loads by itself when it scrolls into view. It stops watching while a page loads and after a failure, so a failing request is never repeated in a loop. Only loaded rows are subscribed to live prices. Where `IntersectionObserver` is missing the button still works.

**The custom range.** `GET /api/stocks/:symbol/history` takes either a `period` or a `from` and `to` in milliseconds, never both. A range must be between an hour and a year long, end no later than now, and start within the last year. The candle size comes from the span with the same tiers as the fixed periods, so a range reads like the period of a similar length and never has more than a few hundred candles. Every history now carries `bucketMs`, so the client can place a live tick on the right candle for any range, and `period` is `custom` for a range.

**One rule per concern.** Candles still depend only on the symbol, the bucket and the current price at now, so a candle is the same whichever request asks for it. A range that ends now matches the fixed period candle for candle, which is tested. A range in the past is walked from now back to its start and only its own candles are returned. The rules for a valid range live in one function that both the generator and the service use. In the browser the range is two date fields (UTC days), validated before anything is sent; a range ending today clamps its end to now and keeps following live ticks, a range that ended earlier does not.

## Alternatives considered

- **Offset paging (page numbers).** Rejected: it shifts under the user if the list changes, and a cursor is just as simple here.
- **Anchoring a past range at its own end.** Rejected: the same candle would differ between a range and a period.
- **Zoom and pan only, with no new API.** Rejected: it could never go beyond the selected period's window.
- **A custom listbox for the pickers.** Not relevant to the API, but the same reasoning chose native date inputs and selects: they come with the keyboard, screen reader and phone behavior for free.

## Consequences

- The list scales to a long universe and the watchlist stays one request.
- A range request in the past costs more the older it is: a one-day range a year back walks about 105,000 five-minute candles, around 220 ms of synchronous work in testing. That is accepted for a simulator. A cheaper walk that skips the parts it does not output is possible if it ever matters.
- The date fields are UTC days, so a user in another time zone sees candles aligned to UTC, as the rest of the chart is.
- Adding `bucketMs` to the history response is additive for the web app, which now reads the candle size from the answer instead of from its own table.
