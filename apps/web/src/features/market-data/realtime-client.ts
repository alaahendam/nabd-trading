import {
  MAX_SYMBOLS_PER_REQUEST,
  type SocketError,
  socketErrorSchema,
  symbolSchema,
  ticksPayloadSchema,
} from '@nabd/shared';
import { z } from 'zod';

import type { ConnectionStatus } from './connection-status';
import type { PriceStore } from './price-store';
import type { SocketPort } from './socket-port';

/** Something unexpected on the wire or in a request. Reported, never thrown. */
export type RealtimeIssue =
  | { kind: 'invalid-ticks'; detail: string }
  | { kind: 'invalid-server-error' }
  | { kind: 'invalid-symbol'; symbol: string };

export interface RealtimeClientOptions {
  onIssue?: (issue: RealtimeIssue) => void;
}

/**
 * The one connection to the server for the whole app.
 *
 * - Components `acquire` the symbols they show and get back a `release`. A symbol is subscribed
 *   while at least one holder needs it.
 * - A reconnect is a new socket on the server, whose rooms start empty, so every `connect`
 *   subscribes all active symbols again.
 * - Everything that arrives is validated with the shared schemas before it is used.
 */
export class RealtimeClient {
  private status: ConnectionStatus = 'connecting';
  private readonly statusListeners = new Set<() => void>();
  private readonly errorListeners = new Set<(error: SocketError) => void>();
  /** Per symbol, the handles currently holding it. */
  private readonly holders = new Map<string, Set<object>>();
  private readonly onIssue: (issue: RealtimeIssue) => void;
  private started = false;
  private browserOnline = true;

  constructor(
    private readonly socket: SocketPort,
    readonly store: PriceStore,
    { onIssue = () => undefined }: RealtimeClientOptions = {},
  ) {
    this.onIssue = onIssue;
    socket.onConnect(() => {
      this.handleConnect();
    });
    socket.onDisconnect((reason) => {
      this.handleDisconnect(reason);
    });
    socket.onTicks((payload) => {
      this.handleTicks(payload);
    });
    socket.onServerError((payload) => {
      this.handleServerError(payload);
    });
    socket.onReconnectAttempt(() => {
      this.setStatus('reconnecting');
    });
    socket.onReconnectFailed(() => {
      this.setStatus('offline');
    });
  }

  getStatus(): ConnectionStatus {
    return this.status;
  }

  subscribeStatus(listener: () => void): () => void {
    this.statusListeners.add(listener);
    return () => {
      this.statusListeners.delete(listener);
    };
  }

  onServerError(listener: (error: SocketError) => void): () => void {
    this.errorListeners.add(listener);
    return () => {
      this.errorListeners.delete(listener);
    };
  }

  connect(): void {
    if (this.started) {
      return;
    }
    this.started = true;
    this.socket.connect();
  }

  disconnect(): void {
    this.started = false;
    this.socket.disconnect();
    this.setStatus('offline');
  }

  /** Fed by the browser's online and offline events. */
  setBrowserOnline(online: boolean): void {
    this.browserOnline = online;
    if (!online) {
      this.setStatus('offline');
    } else if (this.started && !this.socket.connected) {
      this.setStatus('reconnecting');
      this.socket.connect();
    }
  }

  /** Asks for live prices of these symbols. Call the returned function when they are not needed. */
  acquire(symbols: readonly string[]): () => void {
    const valid = [...new Set(symbols)].filter((symbol) => {
      const ok = symbolSchema.safeParse(symbol).success;
      if (!ok) {
        this.onIssue({ kind: 'invalid-symbol', symbol });
      }
      return ok;
    });

    const handle = {};
    const added: string[] = [];
    for (const symbol of valid) {
      let holders = this.holders.get(symbol);
      if (!holders) {
        holders = new Set();
        this.holders.set(symbol, holders);
        added.push(symbol);
      }
      holders.add(handle);
    }
    this.send(added, 'subscribe');

    let released = false;
    return () => {
      if (released) {
        return;
      }
      released = true;
      const removed: string[] = [];
      for (const [symbol, holders] of this.holders) {
        if (holders.delete(handle) && holders.size === 0) {
          this.holders.delete(symbol);
          removed.push(symbol);
        }
      }
      this.send(removed, 'unsubscribe');
    };
  }

  /** Sends only while connected; a later `connect` resubscribes whatever is still active. */
  private send(symbols: readonly string[], method: 'subscribe' | 'unsubscribe'): void {
    if (this.status !== 'connected') {
      return;
    }
    for (let start = 0; start < symbols.length; start += MAX_SYMBOLS_PER_REQUEST) {
      this.socket[method](symbols.slice(start, start + MAX_SYMBOLS_PER_REQUEST));
    }
  }

  private handleConnect(): void {
    this.setStatus('connected');
    this.send([...this.holders.keys()], 'subscribe');
  }

  private handleDisconnect(reason: string): void {
    if (reason === 'io client disconnect') {
      this.setStatus('offline');
      return;
    }
    this.setStatus(this.browserOnline ? 'reconnecting' : 'offline');
    if (reason === 'io server disconnect') {
      // Socket.IO does not retry this one by itself.
      this.socket.connect();
    }
  }

  private handleTicks(payload: unknown): void {
    const parsed = ticksPayloadSchema.safeParse(payload);
    if (parsed.success) {
      this.store.apply(parsed.data.ticks);
    } else {
      this.onIssue({ kind: 'invalid-ticks', detail: z.prettifyError(parsed.error) });
    }
  }

  private handleServerError(payload: unknown): void {
    const parsed = socketErrorSchema.safeParse(payload);
    if (parsed.success) {
      for (const listener of [...this.errorListeners]) {
        listener(parsed.data);
      }
    } else {
      this.onIssue({ kind: 'invalid-server-error' });
    }
  }

  private setStatus(next: ConnectionStatus): void {
    if (next === this.status) {
      return;
    }
    this.status = next;
    for (const listener of [...this.statusListeners]) {
      listener();
    }
  }
}
