import { describe, expect, it } from 'vitest';

import { FakeSocket } from './fake-socket.js';

describe('FakeSocket', () => {
  it('SOK-01 records what the client asks for, as copies', () => {
    const socket = new FakeSocket();
    const symbols = ['AAPL', 'MSFT'];
    socket.connect();
    socket.subscribe(symbols);
    socket.unsubscribe(['MSFT']);
    socket.disconnect();
    symbols.push('NVDA');
    expect(socket.calls).toEqual({
      connect: 1,
      disconnect: 1,
      subscribe: [['AAPL', 'MSFT']],
      unsubscribe: [['MSFT']],
    });
  });

  it('SOK-02 the connected flag follows the server and the client', () => {
    const socket = new FakeSocket();
    expect(socket.connected).toBe(false);
    socket.simulateConnect();
    expect(socket.connected).toBe(true);
    socket.disconnect();
    expect(socket.connected).toBe(false);
    socket.simulateConnect();
    socket.simulateDisconnect('transport close');
    expect(socket.connected).toBe(false);
  });

  it('SOK-03 plays the server to every handler', () => {
    const socket = new FakeSocket();
    const heard: unknown[] = [];
    socket.onConnect(() => heard.push('connect'));
    socket.onDisconnect((reason) => heard.push(['disconnect', reason]));
    socket.onTicks((payload) => heard.push(['ticks', payload]));
    socket.onServerError((payload) => heard.push(['error', payload]));
    socket.onReconnectAttempt(() => heard.push('attempt'));
    socket.onReconnectFailed(() => heard.push('failed'));

    socket.simulateConnect();
    socket.simulateDisconnect('gone');
    socket.simulateTicks({ ticks: [] });
    socket.simulateServerError({ error: 'x' });
    socket.simulateReconnectAttempt();
    socket.simulateReconnectFailed();

    expect(heard).toEqual([
      'connect',
      ['disconnect', 'gone'],
      ['ticks', { ticks: [] }],
      ['error', { error: 'x' }],
      'attempt',
      'failed',
    ]);
  });

  it('SOK-04 several handlers on one event all hear it', () => {
    const socket = new FakeSocket();
    let count = 0;
    socket.onConnect(() => (count += 1));
    socket.onConnect(() => (count += 10));
    socket.simulateConnect();
    expect(count).toBe(11);
  });
});
