# Chart custom range: test matrix

Scope: `custom-range.ts` (the date rules; in `packages/domain/src` since mobile M0, shared with the mobile app), the range switcher in `StockChart`, and the live candle on a custom range. Added in the design polish round; the fixed periods are in `web-stock-chart.md`.

## custom-range.ts (`@nabd/domain`)

It turns two date inputs (`YYYY-MM-DD`, UTC days) into the range the API takes.

| ID     | Behavior                            | Input                                                                 | Expected                                                                            | Level |
| ------ | ----------------------------------- | --------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | ----- |
| CRG-01 | A day's start and end               | `2026-06-17`; and `''`, `2026-13-01`, `2026-02-30`, `abc`, `2026-6-1` | midnight UTC and the last millisecond of that day; the invalid strings give nothing | unit  |
| CRG-02 | A timestamp as a date input value   | a time on 17 June 2026                                                | `2026-06-17`                                                                        | unit  |
| CRG-03 | A range in the past                 | two past days                                                         | from the start of the first day to the end of the last, not live                    | unit  |
| CRG-04 | A range that ends today             | the end date is today                                                 | `to` is now, and the range is live                                                  | unit  |
| CRG-05 | A range that would be under an hour | today, early in the UTC day                                           | `from` moves back so the range is exactly an hour                                   | unit  |
| CRG-06 | Problems                            | invalid text; from after to; to tomorrow; from a year and a bit back  | `invalid`, `order`, `future`, `tooOld`                                              | unit  |
| CRG-07 | The oldest allowed day              | from 364 days before today                                            | accepted                                                                            | unit  |

## Range switcher and the chart

| ID     | Behavior                                       | Input                                               | Expected                                                                                 | Level     |
| ------ | ---------------------------------------------- | --------------------------------------------------- | ---------------------------------------------------------------------------------------- | --------- |
| CHT-19 | The custom option opens a form                 | press Custom                                        | two labeled date fields and an Apply button; Custom is pressed; nothing is requested yet | component |
| CHT-20 | Applying loads that range                      | pick two past days and apply                        | `getHistory` is called with that `from` and `to`; the chart's name shows the dates       | component |
| CHT-21 | A bad range is explained and not sent          | from after to; a day in the future                  | an alert saying what is wrong, and no request                                            | component |
| CHT-22 | Choosing a period leaves the custom range      | press 1W after a custom range                       | the period loads, Custom is not pressed and the form is closed                           | component |
| CHT-23 | Live ticks follow a range that ends today only | a custom range ending today; one ending in the past | the first moves its last candle with ticks; the second never does                        | component |
| CHT-24 | The live candle uses the answer's candle size  | a custom range answered with 30-minute candles      | a tick in the next 30-minute bucket starts a new candle at that bucket's start           | component |
| CHT-25 | The form is in the app language                | `ar`                                                | Arabic labels for custom, from, to and apply, and Arabic problem messages                | component |
| CHT-26 | Pressing Custom again closes the form          | open the form, press Custom again                   | the form closes and nothing is requested                                                 | component |
| CHT-27 | Reopening shows the applied dates              | apply a range, press Custom                         | the fields hold the applied dates                                                        | component |
| CRG-08 | A chart range as the API takes it              | a period; a custom range                            | the period itself; just its `from` and `to`                                              | unit      |
| CRG-09 | A custom range in words                        | a range                                             | its two dates joined by a dash, as `2026-06-10 – 2026-06-12`                             | unit      |
