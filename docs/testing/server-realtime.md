# Test matrix: realtime (tick batcher and Socket.IO gateway)

Modules: `src/modules/realtime/tick-batcher.ts`, `realtime.gateway.ts`, `realtime.module.ts`. Contracts: `@nabd/shared` socket events.

## Purpose and public surface

- `TickBatcher`: collects ticks between flushes. `push(ticks)` groups them by symbol in arrival order; `drain()` returns the groups and empties it. At most `maxPerSymbol` ticks are kept per symbol (the most recent), so a stalled flush cannot grow memory.
- `RealtimeGateway`: a Socket.IO gateway on the default namespace.
  - `subscribe` (payload `{ symbols }`): validates with the shared schema, joins one room per known symbol, and sends the current tick of each so a new subscriber does not wait. A symbol that already has ticks waiting for the next flush is skipped: its pending ticks arrive in that flush, because sending the newer current tick first would put an older tick behind it. Unknown symbols are reported and the known ones still subscribe.
  - `unsubscribe`: leaves the rooms.
  - Every flush interval it drains the batcher and emits one `ticks` event per symbol room with that symbol's pending ticks.
  - Every failure is answered with a `server:error` event in the shared error shape. Global filters and pipes do not apply to gateways, so the gateway validates and answers itself; a bad payload never closes or crashes anything.
- Env `TICK_FLUSH_MS` (10 to 5000, default 250): the flush interval.

## Cases: batcher

| ID     | Case                                 | Input / setup                                  | Expected                                       | Level |
| ------ | ------------------------------------ | ---------------------------------------------- | ---------------------------------------------- | ----- |
| BAT-01 | Ticks are grouped by symbol in order | push mixed ticks of two symbols                | a map of symbol to its ticks, in arrival order | unit  |
| BAT-02 | Drain empties the batcher            | push, drain, drain again                       | first drain has the ticks, second is empty     | unit  |
| BAT-03 | Pushes accumulate until drained      | push twice, drain                              | all ticks of both pushes, in order             | unit  |
| BAT-04 | Only the most recent ticks are kept  | `maxPerSymbol: 3`, push 5 ticks for one symbol | the last 3, in order; other symbols unaffected | unit  |
| BAT-05 | A bad cap is rejected                | `maxPerSymbol` `0`, `-1`, `1.5`                | `RangeError`                                   | unit  |
| BAT-06 | The batcher knows what is waiting    | push, `has`, drain, `has`                      | `true` for a waiting symbol, otherwise `false` | unit  |

## Cases: gateway, unit (fake market and server, fake timers)

| ID     | Case                                         | Input / setup                                                      | Expected                                                                     | Level |
| ------ | -------------------------------------------- | ------------------------------------------------------------------ | ---------------------------------------------------------------------------- | ----- |
| RTM-10 | A flush emits one batch per symbol room      | market stream emits ticks for two symbols, advance the flush timer | one `ticks` emit to each symbol's room with that symbol's ticks in order     | unit  |
| RTM-11 | Nothing is emitted when nothing is pending   | advance the flush timer with no ticks                              | no emit                                                                      | unit  |
| RTM-12 | Destroy stops the flush and the stream       | `onModuleDestroy`, then ticks and timer                            | no emit afterwards                                                           | unit  |
| RTM-13 | Subscribing joins rooms and sends ticks      | two known symbols, nothing pending                                 | joined both rooms; one `ticks` event with both current ticks                 | unit  |
| RTM-14 | Pending ticks are left to the next flush     | a tick pending for `AAPL`; subscribe `AAPL` and `MSFT`             | snapshot has only `MSFT`; `AAPL` arrives in the flush, so ticks stay ordered | unit  |
| RTM-15 | No snapshot when everything is pending       | pending ticks for every subscribed symbol                          | no snapshot event                                                            | unit  |
| RTM-16 | Unknown symbols only                         | subscribe `NOPE`                                                   | `server:error` `NOT_FOUND` with the symbol in `details`; nothing joined      | unit  |
| RTM-17 | Invalid payload on subscribe and unsubscribe | `{ symbols: [] }`                                                  | `server:error` `VALIDATION_ERROR`; nothing joined or left                    | unit  |
| RTM-18 | Unsubscribe leaves every room                | two symbols                                                        | left both rooms                                                              | unit  |
| RTM-19 | Duplicates in one request are ignored        | `['AAPL', 'AAPL']`                                                 | joined once                                                                  | unit  |

## Cases: gateway, end to end (real HTTP server on a random port, `socket.io-client`)

| ID     | Case                                                     | Input / setup                                          | Expected                                                                                                                     | Level |
| ------ | -------------------------------------------------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------- | ----- |
| RTM-01 | Subscribing sends the current prices                     | subscribe `AAPL` and `MSFT`                            | payloads passing `ticksPayloadSchema` that together cover both symbols (at once, or in the next flush if ticks were pending) | e2e   |
| RTM-02 | Live ticks flow for subscribed symbols only              | subscribe `AAPL`, wait for several batches             | batches validate, contain only `AAPL`, timestamps ascend                                                                     | e2e   |
| RTM-03 | Unsubscribe stops the flow                               | subscribe, unsubscribe, wait                           | no further `AAPL` ticks                                                                                                      | e2e   |
| RTM-04 | Invalid payloads answer `server:error`                   | `null`, `{}`, empty list, 51 symbols, a bad symbol     | `VALIDATION_ERROR` each time (shared error shape); the connection stays usable                                               | e2e   |
| RTM-05 | Unknown symbols are reported, known ones still subscribe | subscribe `AAPL` and `NOPE`                            | `server:error` `NOT_FOUND` with the unknown symbols in `details`; `AAPL` ticks arrive                                        | e2e   |
| RTM-06 | Clients only get what they subscribed to                 | client A on `AAPL`, client B on `MSFT`                 | A never receives `MSFT`; B never receives `AAPL`                                                                             | e2e   |
| RTM-07 | Disconnect cleans up                                     | subscribe, disconnect                                  | the symbol room has no members                                                                                               | e2e   |
| RTM-08 | Garbage does not break the server                        | an unknown event, a non-object, then a valid subscribe | the valid subscribe still works                                                                                              | e2e   |

## Cases: env

| ID     | Case                                          | Input / setup                   | Expected                                         | Level |
| ------ | --------------------------------------------- | ------------------------------- | ------------------------------------------------ | ----- |
| ENV-18 | `TICK_FLUSH_MS` is an integer from 10 to 5000 | `{}`, `500`, `9`, `5001`, `1.5` | default `250`, `500` accepted; the rest rejected | unit  |

## Coverage target

100% for `tick-batcher.ts` and `realtime.gateway.ts` (per-file thresholds; the unit and end-to-end cases together).

## Out of scope

CORS for the socket handshake (set in `main.ts` through an adapter, checked in the manual run), per-socket rate limiting (documented gap), client-side reconnect logic (web, Phase 4).
