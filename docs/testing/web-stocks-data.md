# Stocks data hooks: test matrix

Scope: `features/stocks/stock-queries.ts` (`useStocks`, `useStock`, `useHistory`). The hooks are thin wrappers over the API client and the query keys; the tests use a fake `Api` so they pin what the hooks ask for and how they cache, not the network (that is covered by the endpoint tests).

| ID     | Behavior                                | Input                                            | Expected                                                                                | Level |
| ------ | --------------------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------- | ----- |
| STK-01 | Stock list loads                        | `useStocks()` with a resolving API               | `isPending` first, then the stocks; `listStocks` called once                            | hook  |
| STK-02 | Stock list failure                      | `listStocks` rejects with a 404 `ApiClientError` | `isError` with that error, no retry (permanent error)                                   | hook  |
| STK-03 | The abort signal is passed on           | any of the three hooks                           | the API receives an `AbortSignal`, so a cancelled query cancels its request             | hook  |
| STK-04 | One stock by symbol                     | `useStock('AAPL')`                               | `getStock('AAPL')` called; data returned; a different symbol is a different cache entry | hook  |
| STK-05 | History per symbol and period           | `useHistory('AAPL', '1W')`, then `'1M'`          | `getHistory('AAPL', '1W')` then `('AAPL','1M')`; each period is cached separately       | hook  |
| STK-06 | Cache is shared with the list keys      | `useStocks()` twice in one client                | one request for two consumers                                                           | hook  |
| STK-07 | Stock and history keys are hierarchical | invalidate `['stocks','AAPL']`                   | the stock and its history refetch, another symbol does not                              | hook  |
