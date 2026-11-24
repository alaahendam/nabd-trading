# Test matrix: web realtime layer

Module: `apps/web/src/features/market-data`. Design: ADR 0005. Contracts: `@nabd/shared` (`ticksPayloadSchema`, `socketErrorSchema`, `MAX_SYMBOLS_PER_REQUEST`, `symbolSchema`).

## Purpose and public surface

- `PriceStore`: the external store of live prices. `apply(ticks)` coalesces the latest tick per symbol and publishes once per scheduled frame; `get(symbol)` returns a stable immutable `LivePrice` snapshot; `subscribe(symbol, listener)` and `subscribeAll(listener)` notify only on change. Frame scheduling and the clock are injected (`animationFrameSchedule` is the default).
- `freshness(price, { now, status, thresholdMs })`: `none` (no price yet), `fresh` or `stale` (older than the threshold, or the connection is not live).
- `SocketLike`: the port the client talks to (connect, disconnect, subscribe, unsubscribe, event handlers). `createSocketIoAdapter(url)` is the only code that imports `socket.io-client`.
- `RealtimeClient`: one per app. Subscriptions are declarative: `acquire(symbols)` returns a `release` function, a symbol is wanted while at least one holder has it, and the client remembers what the server currently has and, once per tick of the event loop (a microtask), sends only the difference, batched and chunked. So rows that mount together send one message, and a symbol released and acquired again in the same commit sends nothing. The server's side is forgotten whenever the connection drops (server rooms belong to a socket, and a reconnect is a new socket), so every `connect` subscribes everything wanted again. It validates what arrives and tracks `ConnectionStatus` (`connecting`, `connected`, `reconnecting`, `offline`).
- React bindings: `RealtimeProvider`, `useLivePrice`, `useSubscription`, `useConnectionStatus`, `useFreshness` (re-renders only when the answer changes; one shared once-a-second clock tick, `subscribeTick`, makes React look again) and `createRealtimeClient(url)`.

## Cases: price store

| ID     | Case                                           | Input / setup                                                                | Expected                                                                                                   | Level |
| ------ | ---------------------------------------------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ----- |
| PST-01 | Nothing is published before the frame          | `apply` a tick, no frame yet                                                 | `get` is `undefined`, a frame is scheduled                                                                 | unit  |
| PST-02 | A frame publishes the snapshot                 | `apply`, run the frame at a fake time                                        | `get` returns price, volume, server timestamp, `receivedAt` = time of `apply`, `previousPrice` `undefined` | unit  |
| PST-03 | Ticks coalesce within a frame                  | three ticks for one symbol, then the frame                                   | one snapshot with the latest tick; the symbol's listener called once                                       | unit  |
| PST-04 | `previousPrice` is the last published price    | publish 100, then 101, then 101                                              | `previousPrice` is `undefined`, `100`, `101`                                                               | unit  |
| PST-05 | Old and duplicate ticks are ignored            | a tick older than, and one equal to, the published and the pending timestamp | snapshot unchanged, no frame scheduled for ignored-only input                                              | unit  |
| PST-06 | Listeners are per symbol                       | listeners on `AAPL`, `MSFT` and all; ticks for `AAPL` only                   | only the `AAPL` and the global listener are called; the global listener once per frame                     | unit  |
| PST-07 | Snapshots are stable                           | `get` twice between frames; again after a new publish                        | same object until a change, a new object after                                                             | unit  |
| PST-08 | Unsubscribing stops notifications              | unsubscribe a symbol and a global listener, twice each                       | no calls afterwards; the second unsubscribe is harmless                                                    | unit  |
| PST-09 | `clear` empties the store                      | publish, apply (pending), `clear`                                            | `get` is `undefined`, the pending frame is cancelled, listeners of cleared symbols and global are notified | unit  |
| PST-10 | One frame at a time                            | two `apply` calls before a frame; another after it                           | the scheduler is called once, then once more after the frame ran                                           | unit  |
| PST-11 | `animationFrameSchedule` uses animation frames | fake timers                                                                  | the callback runs on the next frame; the returned cancel prevents it                                       | unit  |
| PST-12 | Defaults work without options                  | `new PriceStore()`, fake timers                                              | a tick applied and a frame advanced is published with the real clock                                       | unit  |

## Cases: freshness

| ID     | Case                         | Input / setup                                                     | Expected                               | Level |
| ------ | ---------------------------- | ----------------------------------------------------------------- | -------------------------------------- | ----- |
| STL-01 | No price yet                 | `undefined`                                                       | `none`, whatever the status            | unit  |
| STL-02 | Recent price while connected | received 1 s ago, threshold 10 s                                  | `fresh`                                | unit  |
| STL-03 | Old price while connected    | received 11 s ago                                                 | `stale`; exactly 10 s is still `fresh` | unit  |
| STL-04 | Not connected means stale    | recent price with each of `connecting`, `reconnecting`, `offline` | `stale`                                | unit  |
| STL-05 | The default threshold        | `STALE_AFTER_MS` and no explicit threshold                        | 10 000 ms is used                      | unit  |

## Cases: realtime client (fake `SocketLike`, fake store)

| ID     | Case                                            | Input / setup                                                                                | Expected                                                                                                        | Level |
| ------ | ----------------------------------------------- | -------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | ----- |
| RTC-01 | Initial status                                  | new client                                                                                   | `connecting`                                                                                                    | unit  |
| RTC-02 | `connect` is idempotent                         | `connect()` twice                                                                            | the socket connects once                                                                                        | unit  |
| RTC-03 | Connection events drive the status              | socket `connect`; `disconnect` with `transport close`; `ping timeout`                        | `connected`; `reconnecting`; `reconnecting`                                                                     | unit  |
| RTC-04 | A server-initiated disconnect reconnects        | `disconnect` with `io server disconnect`                                                     | status `reconnecting` and `socket.connect()` called (Socket.IO does not retry this reason itself)               | unit  |
| RTC-05 | A client disconnect is offline                  | `client.disconnect()`                                                                        | the socket disconnects, status `offline`                                                                        | unit  |
| RTC-06 | Reconnect attempts and failure                  | `reconnect_attempt`; `reconnect_failed`                                                      | `reconnecting`; `offline`                                                                                       | unit  |
| RTC-07 | Browser offline and online                      | `setBrowserOnline(false)`, then `true`                                                       | `offline`; then `socket.connect()` is called and the status is `reconnecting`                                   | unit  |
| RTC-08 | Subscribe waits for the connection              | `acquire(['AAPL'])` before `connect`                                                         | nothing emitted; after `connect` one `subscribe(['AAPL'])`                                                      | unit  |
| RTC-09 | Subscribe at once when connected                | connected, `acquire(['AAPL','MSFT'])`, then `acquire(['MSFT','NVDA'])`                       | first call subscribes both; second only `NVDA`                                                                  | unit  |
| RTC-10 | Reference counting                              | two acquirers of `AAPL`; release one; release the other                                      | one subscribe; no unsubscribe after the first release; one unsubscribe after the second                         | unit  |
| RTC-11 | Release is idempotent                           | call the same `release` twice                                                                | counts do not underflow; one unsubscribe in total                                                               | unit  |
| RTC-12 | Release while disconnected                      | acquire, disconnect, release, reconnect                                                      | no unsubscribe emitted; nothing subscribed after reconnect                                                      | unit  |
| RTC-13 | Every `connect` resubscribes the active symbols | acquire two, reconnect twice, release one                                                    | each `connect` emits the active set; a released symbol is not resubscribed                                      | unit  |
| RTC-14 | Requests are chunked                            | 120 symbols                                                                                  | subscribe emits of at most `MAX_SYMBOLS_PER_REQUEST` (50, 50, 20)                                               | unit  |
| RTC-15 | Symbols are cleaned                             | `['AAPL','AAPL']`, `['aapl']`, `[]`                                                          | duplicates collapsed; the invalid symbol is ignored and reported as an issue; an empty list is a no-op release  | unit  |
| RTC-16 | Valid ticks reach the store                     | socket `ticks` with a valid payload                                                          | `store.apply` called with the ticks                                                                             | unit  |
| RTC-17 | Invalid payloads are dropped and reported       | `ticks` with `null`, `{}`, an empty batch, a bad tick; also with no issue handler configured | the store is not touched; an `invalid-ticks` issue is reported each time (and nothing throws without a handler) | unit  |
| RTC-18 | Server errors are surfaced                      | `server:error` with a valid payload; with garbage                                            | listeners get the parsed error; garbage reports an `invalid-server-error` issue                                 | unit  |
| RTC-19 | Status subscribers see changes only             | subscribe, repeat the same status, change it                                                 | notified once per actual change; `getStatus` is stable                                                          | unit  |
| RTC-20 | A reconnect cycle does not duplicate handlers   | connect, disconnect, connect (as StrictMode does), then `ticks`                              | the store receives the ticks once                                                                               | unit  |
| RTC-21 | Release then acquire in one tick sends nothing  | connected and subscribed; `release()` and `acquire` the same symbol in the same tick         | no subscribe and no unsubscribe is sent                                                                         | unit  |
| RTC-22 | One tick, one message                           | three single-symbol acquires, then three releases, each batch in its own tick                | one subscribe with all three symbols; one unsubscribe with all three                                            | unit  |
| RTC-23 | The server is forgotten across a disconnect     | subscribed, `disconnect()`, `connect()`, socket connects                                     | the symbol is subscribed again                                                                                  | unit  |
| RTC-24 | A browser blip does not strand the status       | connected, `setBrowserOnline(false)`, then `true` while the socket never dropped             | status returns to `connected` and `socket.connect()` is not called again                                        | unit  |

## Cases: socket.io adapter (mocked `socket.io-client`)

| ID     | Case                                     | Input / setup                                  | Expected                                                                                                      | Level |
| ------ | ---------------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ----- |
| SOC-01 | It creates one manual socket for the URL | `createSocketIoAdapter(url)`                   | `io(url, { autoConnect: false })`, nothing connected yet                                                      | unit  |
| SOC-02 | Connection control and state             | `connect()`, `disconnect()`, `connected`       | delegated to the socket                                                                                       | unit  |
| SOC-03 | Subscriptions use the shared event names | `subscribe(['AAPL'])`, `unsubscribe(['AAPL'])` | `emit(SOCKET_EVENTS.subscribe, { symbols })` and `unsubscribe`                                                | unit  |
| SOC-04 | Handlers map to Socket.IO events         | each `on*` method, then trigger the event      | `connect`, `disconnect` (with reason), `ticks`, `server:error`; reconnect events on the manager (`socket.io`) | unit  |

## Cases: React bindings (fake client, Testing Library)

| ID    | Case                                     | Input / setup                                                 | Expected                                                                                                                                  | Level     |
| ----- | ---------------------------------------- | ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| HK-01 | `useLivePrice` follows the store         | component for `AAPL`, publish a tick                          | `undefined`, then the snapshot after the frame                                                                                            | component |
| HK-02 | Only the changed symbol re-renders       | components for `AAPL` and `MSFT`, a tick for `AAPL`           | the `AAPL` component re-rendered, the `MSFT` one did not                                                                                  | component |
| HK-03 | `useSubscription` acquires and releases  | mount, change symbols, unmount                                | acquire on mount; the diff on change (old released, new acquired); release on unmount                                                     | component |
| HK-04 | StrictMode is safe                       | render inside `StrictMode`                                    | after mount the symbol is acquired exactly once net; after unmount released                                                               | component |
| HK-05 | `useConnectionStatus` follows the client | change the status                                             | the component shows the new status                                                                                                        | component |
| HK-06 | `useFreshness` ages with time            | tick, advance fake timers past the threshold; then disconnect | `fresh`, then `stale`; `stale` immediately when not connected                                                                             | component |
| HK-07 | The provider runs the connection         | mount, unmount                                                | `connect()` on mount, `disconnect()` on unmount; window `offline` and `online` events reach `setBrowserOnline`                            | component |
| HK-08 | Hooks need the provider                  | render a hook without it                                      | a clear error message                                                                                                                     | component |
| HK-09 | One shared clock tick                    | many listeners, then unsubscribe them                         | a single timer calls every listener each second; it stops after the last unsubscribes and restarts later; unsubscribing twice is harmless | unit      |
| HK-10 | The factory builds the app's client      | `createRealtimeClient(url)` with the adapter mocked           | a `RealtimeClient` over the adapter for that URL, with its own `PriceStore`, status `connecting`                                          | unit      |

## Coverage target

100% statements, branches, functions and lines for every file in `features/market-data` (per-file thresholds in `vitest.config.ts`).

## Out of scope

The real server (checked by the browser run in Task 12 and by the server's own end-to-end tests), chart rendering, stock list and detail screens (Phase 5).
