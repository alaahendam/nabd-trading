# Stocks data hooks: test matrix

Scope: `packages/data/src/stock-queries.ts` and `use-stock-list.ts` (`useStocksPages`, `useStocksBySymbols`, `useStock`, `useHistory`, `useStockList`), shared by web and mobile since mobile M0; before that in `features/stocks`. The hooks are thin wrappers over the API client and the query keys; the tests use a fake `Api` so they pin what the hooks ask for and how they cache, not the network (that is covered by the endpoint tests).

| ID     | Behavior                                | Input                                            | Expected                                                                                | Level |
| ------ | --------------------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------- | ----- |
| STK-01 | Stock list loads                        | `useStocks()` with a resolving API               | `isPending` first, then the stocks; `listStocks` called once                            | hook  |
| STK-02 | Stock list failure                      | `listStocks` rejects with a 404 `ApiClientError` | `isError` with that error, no retry (permanent error)                                   | hook  |
| STK-03 | The abort signal is passed on           | any of the three hooks                           | the API receives an `AbortSignal`, so a cancelled query cancels its request             | hook  |
| STK-04 | One stock by symbol                     | `useStock('AAPL')`                               | `getStock('AAPL')` called; data returned; a different symbol is a different cache entry | hook  |
| STK-05 | History per symbol and period           | `useHistory('AAPL', '1W')`, then `'1M'`          | `getHistory('AAPL', '1W')` then `('AAPL','1M')`; each period is cached separately       | hook  |
| STK-06 | Cache is shared with the list keys      | `useStocks()` twice in one client                | one request for two consumers                                                           | hook  |
| STK-07 | Stock and history keys are hierarchical | invalidate `['stocks','AAPL']`                   | the stock and its history refetch, another symbol does not                              | hook  |

## Paged and filtered list (design polish)

| ID     | Behavior                                       | Input                                                        | Expected                                                                                               | Level |
| ------ | ---------------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------ | ----- |
| STK-12 | The first page, then the next by cursor        | `useStocksPages()` with a first page that has a `nextCursor` | the first request has a limit of 10 and no cursor; `fetchNextPage` asks with that cursor; pages add up | hook  |
| STK-13 | No next page at the end                        | a page with `nextCursor` null                                | `hasNextPage` is false                                                                                 | hook  |
| STK-14 | The symbols filter                             | `useStocksBySymbols(['AAPL','MSFT'])`                        | one request with those symbols and no limit; the stocks come back                                      | hook  |
| STK-15 | No request without symbols                     | `useStocksBySymbols(undefined)` and `([])`                   | nothing is requested                                                                                   | hook  |
| STK-16 | Filtered results are cached per symbol set     | the same symbols in another order; a different set           | one request for the first two; another for the different set                                           | hook  |
| STK-17 | A disabled paged list asks for nothing         | `useStocksPages(false)`                                      | no request                                                                                             | hook  |
| STK-18 | A changing filter keeps the old rows meanwhile | the symbols change                                           | the previous result stays as placeholder data until the new one arrives                                | hook  |
| STK-19 | History for a custom range                     | `useHistory('AAPL', { from, to })`, then a period            | the API gets the range object; the range and each period are cached separately                         | hook  |
