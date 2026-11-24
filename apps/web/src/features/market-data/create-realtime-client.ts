import { PriceStore } from './price-store';
import { RealtimeClient } from './realtime-client';
import { createSocketIoAdapter } from './socket-io-adapter';

/** The app's realtime client: a Socket.IO connection to `url` feeding its own price store. */
export function createRealtimeClient(url: string): RealtimeClient {
  return new RealtimeClient(createSocketIoAdapter(url), new PriceStore());
}
