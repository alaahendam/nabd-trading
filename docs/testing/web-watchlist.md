# Watchlist: test matrix

Scope: `features/watchlist`: the data hooks (`useWatchlist`, `useWatchlistToggle`), `WatchlistToggle` (the star) and `WatchlistView` (the page body). The server's add and remove are idempotent, so the client may repeat them safely. Tests use the fake `Api` and the feature harness.

## Data hooks

| ID     | Behavior                                         | Input                                                   | Expected                                                                                          | Level |
| ------ | ------------------------------------------------ | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ----- |
| WLH-01 | The list loads                                   | `useWatchlist()`                                        | pending, then the items; the abort signal is passed on                                            | hook  |
| WLH-02 | The list fails                                   | a 404 `ApiClientError`                                  | `isError` with that error, not retried                                                            | hook  |
| WLH-03 | Adding is optimistic                             | toggle on, with a server that has not answered yet      | the cache holds the symbol at once; after the answer the list is fetched again                    | hook  |
| WLH-04 | Removing is optimistic                           | toggle off, server pending                              | the cache lacks the symbol at once; after the answer the list is fetched again                    | hook  |
| WLH-05 | A failed add rolls back                          | the add rejects                                         | the cache returns to the previous list; the mutation reports the error; the list is fetched again | hook  |
| WLH-06 | A failed remove rolls back                       | the remove rejects                                      | the symbol is back in the cache                                                                   | hook  |
| WLH-07 | Adding twice does not duplicate                  | add a symbol already in the cache                       | one entry                                                                                         | hook  |
| WLH-08 | A running fetch cannot undo the optimistic state | a list fetch in flight when the toggle starts           | that fetch is cancelled                                                                           | hook  |
| WLH-09 | Rollback with nothing cached                     | toggle before the list ever loaded, then the call fails | the cache is left empty (nothing was known) and the list is fetched once more                     | hook  |
| WLH-10 | Writes are not retried                           | a failing remove                                        | the API is called once                                                                            | hook  |
| WLH-11 | A failure before the call still ends well        | the optimistic update cannot start                      | the error is reported, no write is sent, and the list is fetched again                            | hook  |

## WatchlistToggle (the star)

| ID     | Behavior                         | Input                                  | Expected                                                       | Level     |
| ------ | -------------------------------- | -------------------------------------- | -------------------------------------------------------------- | --------- |
| WTG-01 | State from the watchlist         | AAPL not in the list; then in the list | a button named "Watch AAPL", `aria-pressed` false; then true   | component |
| WTG-02 | Adding                           | click                                  | pressed at once; `addToWatchlist('AAPL')` called               | component |
| WTG-03 | Removing                         | click when watched                     | not pressed at once; `removeFromWatchlist('AAPL')` called      | component |
| WTG-04 | A failure reverts and says so    | the call rejects                       | the star goes back; an alert "Could not update your watchlist" | component |
| WTG-05 | Disabled while the list loads    | the list request is pending            | the button is disabled                                         | component |
| WTG-06 | A new attempt clears the message | fail, then click again and succeed     | the alert is gone                                              | component |
| WTG-07 | Arabic                           | `ar`                                   | the button has the Arabic name with the Latin symbol           | component |
| WTG-08 | The glyph is decorative          | any                                    | the star character is hidden from assistive technology         | component |

## WatchlistView

| ID     | Behavior                            | Input                                      | Expected                                                          | Level     |
| ------ | ----------------------------------- | ------------------------------------------ | ----------------------------------------------------------------- | --------- |
| WLV-01 | Loading                             | the watchlist request is pending           | a busy status named "Loading watchlist…"                          | component |
| WLV-02 | Empty                               | an empty watchlist                         | "Your watchlist is empty", a hint, and a link to the stock list   | component |
| WLV-03 | Shows the watched stocks            | AAPL watched, BRK.B not                    | only the AAPL row, with its star pressed                          | component |
| WLV-04 | Removing takes the row away at once | press the star of the only row             | the row goes and the empty state shows, before the server answers | component |
| WLV-05 | Error and retry                     | the watchlist request fails, then succeeds | an alert with a retry button; pressing it shows the stocks        | component |
| WLV-06 | A failed refresh keeps the list     | loaded, then the next request fails        | the rows stay and no error replaces them                          | component |
