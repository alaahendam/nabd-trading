import {
  ROUTES,
  symbolSchema,
  type WatchlistItemResponse,
  type WatchlistResponse,
} from '@nabd/shared';
import { Controller, Delete, Get, HttpCode, Param, Put, UseGuards } from '@nestjs/common';

import { ZodValidationPipe } from '../../common/zod-validation.pipe.js';
import { type AuthUser, CurrentUser, IdentityGuard } from '../identity/index.js';
import { WatchlistService } from './watchlist.service.js';

const symbolPipe = new ZodValidationPipe(symbolSchema);

@Controller()
@UseGuards(IdentityGuard)
export class WatchlistController {
  constructor(private readonly watchlist: WatchlistService) {}

  @Get(ROUTES.watchlist)
  list(@CurrentUser() user: AuthUser): WatchlistResponse {
    return { data: this.watchlist.list(user.id) };
  }

  @Put(ROUTES.watchlistItem)
  add(
    @CurrentUser() user: AuthUser,
    @Param('symbol', symbolPipe) symbol: string,
  ): WatchlistItemResponse {
    return { data: this.watchlist.add(user.id, symbol) };
  }

  @Delete(ROUTES.watchlistItem)
  @HttpCode(204)
  remove(@CurrentUser() user: AuthUser, @Param('symbol', symbolPipe) symbol: string): void {
    this.watchlist.remove(user.id, symbol);
  }
}
