import { Module } from '@nestjs/common';

import { MarketModule } from '../market/index.js';
import { StocksController } from './stocks.controller.js';

@Module({ imports: [MarketModule], controllers: [StocksController] })
export class StocksModule {}
