import { PriceStore } from './price-store.js';
import { RealtimeClient } from './realtime-client.js';
import { createSocketIoAdapter } from './socket-io-adapter.js';

/** The app's realtime client: a Socket.IO connection to `url` feeding its own price store. */
export function createRealtimeClient(url: string): RealtimeClient {
  return new RealtimeClient(createSocketIoAdapter(url), new PriceStore());
}
