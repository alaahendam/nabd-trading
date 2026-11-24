/**
 * What the realtime client needs from a socket. The Socket.IO adapter implements it, and tests
 * implement it with a fake, so the client never touches the network or `socket.io-client`.
 *
 * Payloads arrive as `unknown` on purpose: they come from the network and are validated.
 */
export interface SocketPort {
  readonly connected: boolean;
  connect(): void;
  disconnect(): void;
  subscribe(symbols: string[]): void;
  unsubscribe(symbols: string[]): void;
  onConnect(handler: () => void): void;
  onDisconnect(handler: (reason: string) => void): void;
  onTicks(handler: (payload: unknown) => void): void;
  onServerError(handler: (payload: unknown) => void): void;
  onReconnectAttempt(handler: () => void): void;
  onReconnectFailed(handler: () => void): void;
}
