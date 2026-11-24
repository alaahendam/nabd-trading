import { z } from 'zod';

import { dataEnvelope, symbolSchema, timestampSchema } from './market.js';

/** Lowercase because Node lowercases incoming header names. */
export const CLIENT_ID_HEADER = 'x-client-id';

/** Anonymous identity: a UUID the browser generates once and sends on every request. */
export const clientIdSchema = z.uuid();

export const watchlistItemSchema = z.object({
  symbol: symbolSchema,
  addedAt: timestampSchema,
});
export type WatchlistItem = z.infer<typeof watchlistItemSchema>;

export const watchlistResponseSchema = dataEnvelope(z.array(watchlistItemSchema));
export type WatchlistResponse = z.infer<typeof watchlistResponseSchema>;

export const watchlistItemResponseSchema = dataEnvelope(watchlistItemSchema);
export type WatchlistItemResponse = z.infer<typeof watchlistItemResponseSchema>;
