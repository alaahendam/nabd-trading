import type { SocketPort } from '../features/market-data/socket-port';

/** A socket for tests: records what the client asks for and lets a test play the server. */
export class FakeSocket implements SocketPort {
  connected = false;

  readonly calls = {
    connect: 0,
    disconnect: 0,
    subscribe: [] as string[][],
    unsubscribe: [] as string[][],
  };

  private readonly handlers = {
    connect: [] as (() => void)[],
    disconnect: [] as ((reason: string) => void)[],
    ticks: [] as ((payload: unknown) => void)[],
    serverError: [] as ((payload: unknown) => void)[],
    reconnectAttempt: [] as (() => void)[],
    reconnectFailed: [] as (() => void)[],
  };

  connect(): void {
    this.calls.connect += 1;
  }

  disconnect(): void {
    this.calls.disconnect += 1;
    this.connected = false;
  }

  subscribe(symbols: string[]): void {
    this.calls.subscribe.push([...symbols]);
  }

  unsubscribe(symbols: string[]): void {
    this.calls.unsubscribe.push([...symbols]);
  }

  onConnect(handler: () => void): void {
    this.handlers.connect.push(handler);
  }

  onDisconnect(handler: (reason: string) => void): void {
    this.handlers.disconnect.push(handler);
  }

  onTicks(handler: (payload: unknown) => void): void {
    this.handlers.ticks.push(handler);
  }

  onServerError(handler: (payload: unknown) => void): void {
    this.handlers.serverError.push(handler);
  }

  onReconnectAttempt(handler: () => void): void {
    this.handlers.reconnectAttempt.push(handler);
  }

  onReconnectFailed(handler: () => void): void {
    this.handlers.reconnectFailed.push(handler);
  }

  /** The server accepted the connection (also what a reconnect looks like). */
  simulateConnect(): void {
    this.connected = true;
    for (const handler of this.handlers.connect) {
      handler();
    }
  }

  simulateDisconnect(reason: string): void {
    this.connected = false;
    for (const handler of this.handlers.disconnect) {
      handler(reason);
    }
  }

  simulateTicks(payload: unknown): void {
    for (const handler of this.handlers.ticks) {
      handler(payload);
    }
  }

  simulateServerError(payload: unknown): void {
    for (const handler of this.handlers.serverError) {
      handler(payload);
    }
  }

  simulateReconnectAttempt(): void {
    for (const handler of this.handlers.reconnectAttempt) {
      handler();
    }
  }

  simulateReconnectFailed(): void {
    for (const handler of this.handlers.reconnectFailed) {
      handler();
    }
  }
}
