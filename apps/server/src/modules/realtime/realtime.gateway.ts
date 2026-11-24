import {
  type ClientToServerEvents,
  createApiError,
  type ServerToClientEvents,
  SOCKET_EVENTS,
  subscriptionPayloadSchema,
  symbolRoom,
} from '@nabd/shared';
import { Inject, type OnModuleDestroy } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  type OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Subscription } from 'rxjs';
import type { Server, Socket } from 'socket.io';
import type { ZodError } from 'zod';

import { MarketService } from '../market/index.js';
import { REALTIME_OPTIONS, type RealtimeOptions } from './realtime.options.js';
import { TickBatcher } from './tick-batcher.js';

type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

/**
 * Live ticks over Socket.IO. One room per symbol; pending ticks are sent once per flush interval.
 * Global filters and pipes do not apply to gateways, so this class validates and answers itself:
 * a bad payload gets a `server:error` event and never closes or crashes anything.
 */
@WebSocketGateway()
export class RealtimeGateway implements OnGatewayInit, OnModuleDestroy {
  @WebSocketServer()
  server!: Server<ClientToServerEvents, ServerToClientEvents>;

  private readonly batcher = new TickBatcher();
  private subscription: Subscription | undefined;
  private timer: NodeJS.Timeout | undefined;

  constructor(
    private readonly market: MarketService,
    @Inject(REALTIME_OPTIONS) private readonly options: RealtimeOptions,
  ) {}

  afterInit(): void {
    this.subscription = this.market.ticks$.subscribe((ticks) => {
      this.batcher.push(ticks);
    });
    this.timer = setInterval(() => {
      this.flush();
    }, this.options.flushMs);
    this.timer.unref();
  }

  onModuleDestroy(): void {
    clearInterval(this.timer);
    this.subscription?.unsubscribe();
  }

  @SubscribeMessage(SOCKET_EVENTS.subscribe)
  async subscribe(@MessageBody() body: unknown, @ConnectedSocket() socket: TypedSocket) {
    const payload = subscriptionPayloadSchema.safeParse(body);
    if (!payload.success) {
      this.rejectInvalid(socket, payload.error);
      return;
    }

    const symbols = [...new Set(payload.data.symbols)];
    const known = symbols.filter((symbol) => this.market.hasSymbol(symbol));
    const unknown = symbols.filter((symbol) => !this.market.hasSymbol(symbol));

    if (known.length > 0) {
      await socket.join(known.map(symbolRoom));
      // A symbol with ticks still pending gets them in the next flush. Sending the latest tick
      // now as well would put a newer tick ahead of older pending ones.
      const settled = known.filter((symbol) => !this.batcher.has(symbol));
      if (settled.length > 0) {
        socket.emit(SOCKET_EVENTS.ticks, { ticks: this.market.latestTicks(settled) });
      }
    }
    if (unknown.length > 0) {
      socket.emit(
        SOCKET_EVENTS.error,
        createApiError('NOT_FOUND', 'Unknown symbols', { symbols: unknown }).error,
      );
    }
  }

  @SubscribeMessage(SOCKET_EVENTS.unsubscribe)
  async unsubscribe(@MessageBody() body: unknown, @ConnectedSocket() socket: TypedSocket) {
    const payload = subscriptionPayloadSchema.safeParse(body);
    if (!payload.success) {
      this.rejectInvalid(socket, payload.error);
      return;
    }
    for (const symbol of payload.data.symbols) {
      await socket.leave(symbolRoom(symbol));
    }
  }

  /** Sends what has piled up since the last flush: one event per symbol room. */
  flush(): void {
    for (const [symbol, ticks] of this.batcher.drain()) {
      this.server.to(symbolRoom(symbol)).emit(SOCKET_EVENTS.ticks, { ticks });
    }
  }

  private rejectInvalid(socket: TypedSocket, error: ZodError): void {
    socket.emit(
      SOCKET_EVENTS.error,
      createApiError(
        'VALIDATION_ERROR',
        'Invalid subscription',
        error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message })),
      ).error,
    );
  }
}
