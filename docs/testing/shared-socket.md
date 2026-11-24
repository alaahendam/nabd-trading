# Test matrix: shared socket contracts

Module: `packages/shared/src/socket.ts`.

## Purpose and public surface

- `SOCKET_EVENTS`: the only event names. Client to server: `subscribe`, `unsubscribe`. Server to client: `ticks` (batched updates) and `server:error`.
- `MAX_SYMBOLS_PER_REQUEST`, `subscriptionPayloadSchema`: what a client may ask for in one message.
- `ticksPayloadSchema`: one batch of ticks. Ticks for the same symbol are ordered oldest to newest within a batch.
- `socketErrorSchema`: the failure payload, the same `{ code, message, details? }` shape as the REST error body, so there is one error shape across both transports.
- `ClientToServerEvents`, `ServerToClientEvents`: typed event maps for the `socket.io` generics, keyed by `SOCKET_EVENTS` so a name is never typed twice. These are compile-time contracts; payloads from the network are still validated with the schemas (Socket.IO's own docs say type hints do not replace validation).
- `symbolRoom`: the room a symbol's subscribers join (one room per symbol).

## Cases

| ID     | Case                                     | Input / setup                                                       | Expected                                                      | Level                              |
| ------ | ---------------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------- | ---------------------------------- |
| SOC-01 | Event names are the agreed set           | `SOCKET_EVENTS`                                                     | `subscribe`, `unsubscribe`, `ticks`, `server:error`           | unit                               |
| SOC-02 | Subscription accepts 1 to the maximum    | 1 symbol, exactly `MAX_SYMBOLS_PER_REQUEST`, duplicates             | parses (duplicates are allowed: subscribing is idempotent)    | unit                               |
| SOC-03 | Subscription rejects bad payloads        | empty list, max + 1, invalid symbol, missing key, non-array, `null` | rejected                                                      | unit                               |
| SOC-04 | The request limit is 50                  | `MAX_SYMBOLS_PER_REQUEST`                                           | `50`                                                          | unit                               |
| SOC-05 | Ticks payload accepts a batch            | ticks for several symbols and repeats of one                        | parses                                                        | unit                               |
| SOC-06 | Ticks payload rejects bad batches        | empty batch, an invalid tick, missing key                           | rejected                                                      | unit                               |
| SOC-07 | Socket error shares the REST error shape | the `error` object of an API error, with and without details        | parses; unknown code and empty message rejected               | unit                               |
| SOC-08 | Rooms are per symbol                     | `AAPL`, `MSFT`                                                      | `symbol:AAPL`, `symbol:MSFT`, different from each other       | unit                               |
| SOC-09 | Event maps are keyed by the event names  | type-level assertions                                               | handlers take the schema-derived payload types, nothing extra | type (checked by `pnpm typecheck`) |

## Coverage target

100% statements, branches, functions and lines (enforced in `vitest.config.ts`).

## Out of scope

The gateway, rooms and batching implementation (server, Phase 3), the client store and reconnect logic (web, Phase 4). Compatibility with the real `socket.io` generics is confirmed when the gateway is built in Phase 3.
