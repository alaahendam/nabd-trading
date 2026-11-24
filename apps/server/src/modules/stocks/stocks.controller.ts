import {
  type HistoryQuery,
  historyQuerySchema,
  type HistoryResponse,
  ROUTES,
  type StockResponse,
  type StocksQuery,
  stocksQuerySchema,
  type StocksResponse,
  symbolSchema,
} from '@nabd/shared';
import { Controller, Get, Param, Query } from '@nestjs/common';

import { ApiException } from '../../common/api-exception.js';
import { ZodValidationPipe } from '../../common/zod-validation.pipe.js';
import { MarketService } from '../market/index.js';
import { paginateStocks } from './stocks.pagination.js';

const symbolPipe = new ZodValidationPipe(symbolSchema);
const notFound = (symbol: string) =>
  new ApiException('NOT_FOUND', `No stock with symbol ${symbol}`);

@Controller()
export class StocksController {
  constructor(private readonly market: MarketService) {}

  @Get(ROUTES.stocks)
  list(@Query(new ZodValidationPipe(stocksQuerySchema)) query: StocksQuery): StocksResponse {
    return paginateStocks(this.market.stocks(), query);
  }

  @Get(ROUTES.stock)
  get(@Param('symbol', symbolPipe) symbol: string): StockResponse {
    const stock = this.market.stock(symbol);
    if (!stock) {
      throw notFound(symbol);
    }
    return { data: stock };
  }

  @Get(ROUTES.history)
  history(
    @Param('symbol', symbolPipe) symbol: string,
    @Query(new ZodValidationPipe(historyQuerySchema)) query: HistoryQuery,
  ): HistoryResponse {
    const history =
      'period' in query
        ? this.market.history(symbol, query.period)
        : this.market.rangeHistory(symbol, query);
    if (!history) {
      throw notFound(symbol);
    }
    return { data: history };
  }
}
