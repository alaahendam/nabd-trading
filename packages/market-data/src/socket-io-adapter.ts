import { type ClientToServerEvents, type ServerToClientEvents, SOCKET_EVENTS } from '@nabd/shared';
import { io, type Socket } from 'socket.io-client';

import type { SocketPort } from './socket-port.js';

/**
 * The only place that imports `socket.io-client` (enforced by lint). It creates a socket that
 * does not connect until asked and exposes it through the small `SocketPort`.
 *
 * Reconnection uses Socket.IO's defaults: unlimited attempts, with a delay that grows from one
 * to five seconds. Payloads are passed on as `unknown`: the server's types do not make network
 * data trustworthy.
 */
export function createSocketIoAdapter(url: string): SocketPort {
  const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(url, {
    autoConnect: false,
  });

  return {
    get connected() {
      return socket.connected;
    },
    connect() {
      socket.connect();
    },
    disconnect() {
      socket.disconnect();
    },
    subscribe(symbols) {
      socket.emit(SOCKET_EVENTS.subscribe, { symbols });
    },
    unsubscribe(symbols) {
      socket.emit(SOCKET_EVENTS.unsubscribe, { symbols });
    },
    onConnect(handler) {
      socket.on('connect', handler);
    },
    onDisconnect(handler) {
      socket.on('disconnect', (reason) => {
        handler(reason);
      });
    },
    onTicks(handler) {
      socket.on(SOCKET_EVENTS.ticks, handler);
    },
    onServerError(handler) {
      socket.on(SOCKET_EVENTS.error, handler);
    },
    onReconnectAttempt(handler) {
      socket.io.on('reconnect_attempt', () => {
        handler();
      });
    },
    onReconnectFailed(handler) {
      socket.io.on('reconnect_failed', handler);
    },
  };
}
