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
 * Subscriptions are declarative. Components `acquire` the symbols they show and get back a
 * `release`; a symbol is wanted while at least one holder has it. The client remembers what the
 * server currently has (`serverSubscribed`) and, once per tick of the event loop, sends only the
 * difference, batched. So a list of rows that mount together sends one message, and a symbol
 * that is released and acquired again in the same commit is never sent at all.
 *
 * A reconnect is a new socket on the server, whose rooms start empty, so the server's side is
 * forgotten whenever the connection drops and everything wanted is subscribed again on connect.
 *
 * Everything that arrives is validated with the shared schemas before it is used.
 */
export class RealtimeClient {
  private status: ConnectionStatus = 'connecting';
  private readonly statusListeners = new Set<() => void>();
  private readonly errorListeners = new Set<(error: SocketError) => void>();
  /** Per symbol, the handles currently holding it: what the app wants. */
  private readonly holders = new Map<string, Set<object>>();
  /** What the server currently has for this socket. */
  private readonly serverSubscribed = new Set<string>();
  private readonly onIssue: (issue: RealtimeIssue) => void;
  private reconcileScheduled = false;
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
    this.serverSubscribed.clear();
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
    for (const symbol of valid) {
      const holders = this.holders.get(symbol) ?? new Set<object>();
      holders.add(handle);
      this.holders.set(symbol, holders);
    }
    this.scheduleReconcile();

    let released = false;
    return () => {
      if (released) {
        return;
      }
      released = true;
      for (const [symbol, holders] of this.holders) {
        if (holders.delete(handle) && holders.size === 0) {
          this.holders.delete(symbol);
        }
      }
      this.scheduleReconcile();
    };
  }

  private scheduleReconcile(): void {
    if (this.reconcileScheduled) {
      return;
    }
    this.reconcileScheduled = true;
    queueMicrotask(() => {
      this.reconcileScheduled = false;
      this.reconcile();
    });
  }

  /** Brings the server in line with what the app wants. Only while connected. */
  private reconcile(): void {
    if (this.status !== 'connected') {
      return;
    }
    const toAdd = [...this.holders.keys()].filter((symbol) => !this.serverSubscribed.has(symbol));
    const toRemove = [...this.serverSubscribed].filter((symbol) => !this.holders.has(symbol));
    for (const symbol of toAdd) {
      this.serverSubscribed.add(symbol);
    }
    for (const symbol of toRemove) {
      this.serverSubscribed.delete(symbol);
    }
    this.send(toAdd, 'subscribe');
    this.send(toRemove, 'unsubscribe');
  }

  private send(symbols: readonly string[], method: 'subscribe' | 'unsubscribe'): void {
    for (let start = 0; start < symbols.length; start += MAX_SYMBOLS_PER_REQUEST) {
      this.socket[method](symbols.slice(start, start + MAX_SYMBOLS_PER_REQUEST));
    }
  }

  private handleConnect(): void {
    this.setStatus('connected');
    this.serverSubscribed.clear();
    this.reconcile();
  }

  private handleDisconnect(reason: string): void {
    this.serverSubscribed.clear();
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
