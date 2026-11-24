import {
  type HistoryQuery,
  historyQuerySchema,
  type HistoryResponse,
  ROUTES,
  type StockResponse,
  type StocksResponse,
  symbolSchema,
} from '@nabd/shared';
import { Controller, Get, Param, Query } from '@nestjs/common';

import { ApiException } from '../../common/api-exception.js';
import { ZodValidationPipe } from '../../common/zod-validation.pipe.js';
import { MarketService } from '../market/index.js';

const symbolPipe = new ZodValidationPipe(symbolSchema);
const notFound = (symbol: string) =>
  new ApiException('NOT_FOUND', `No stock with symbol ${symbol}`);

@Controller()
export class StocksController {
  constructor(private readonly market: MarketService) {}

  @Get(ROUTES.stocks)
  list(): StocksResponse {
    return { data: this.market.stocks() };
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
    const history = this.market.history(symbol, query.period);
    if (!history) {
      throw notFound(symbol);
    }
    return { data: history };
  }
}
