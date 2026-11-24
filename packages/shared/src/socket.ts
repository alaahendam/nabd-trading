import { z } from 'zod';

import { apiErrorSchema } from './errors.js';
import { priceTickSchema, symbolSchema } from './market.js';

export const SOCKET_EVENTS = {
  subscribe: 'subscribe',
  unsubscribe: 'unsubscribe',
  ticks: 'ticks',
  error: 'server:error',
} as const;

export const MAX_SYMBOLS_PER_REQUEST = 50;

/** Subscribing and unsubscribing are idempotent, so repeated symbols are harmless. */
export const subscriptionPayloadSchema = z.object({
  symbols: z.array(symbolSchema).min(1).max(MAX_SYMBOLS_PER_REQUEST),
});
export type SubscriptionPayload = z.infer<typeof subscriptionPayloadSchema>;

/** One batch of ticks. Within a batch, ticks of the same symbol run oldest to newest. */
export const ticksPayloadSchema = z.object({
  ticks: z.array(priceTickSchema).min(1),
});
export type TicksPayload = z.infer<typeof ticksPayloadSchema>;

/** The same error object as the REST body, so there is one error shape across transports. */
export const socketErrorSchema = apiErrorSchema.shape.error;
export type SocketError = z.infer<typeof socketErrorSchema>;

export interface ClientToServerEvents {
  [SOCKET_EVENTS.subscribe]: (payload: SubscriptionPayload) => void;
  [SOCKET_EVENTS.unsubscribe]: (payload: SubscriptionPayload) => void;
}

export interface ServerToClientEvents {
  [SOCKET_EVENTS.ticks]: (payload: TicksPayload) => void;
  [SOCKET_EVENTS.error]: (payload: SocketError) => void;
}

/** One room per symbol; a socket joins it when it subscribes. */
export function symbolRoom(symbol: string): string {
  return `symbol:${symbol}`;
}
