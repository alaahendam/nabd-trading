import { createClientIdProvider } from '@nabd/api-client';

import { type AsyncKeyValueStore, StartupStorage } from './startup-storage';

const KEYS = ['a', 'b'];

/** A plain in-memory store that records what was written. */
function createFakeStore(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  const written: [string, string][] = [];
  const store: AsyncKeyValueStore = {
    multiGet: (keys) => Promise.resolve(keys.map((key) => [key, data.get(key) ?? null] as const)),
    setItem: (key, value) => {
      written.push([key, value]);
      data.set(key, value);
      return Promise.resolve();
    },
  };
  return { store, written };
}

describe('StartupStorage', () => {
  it('STO-01 returns the stored values after loading', async () => {
    const { store } = createFakeStore({ a: '1', b: '2' });

    const storage = await StartupStorage.load(store, KEYS);

    expect(storage.getItem('a')).toBe('1');
    expect(storage.getItem('b')).toBe('2');
  });

  it('STO-02 returns null for a key that was never stored', async () => {
    const { store } = createFakeStore({ a: '1' });

    const storage = await StartupStorage.load(store, KEYS);

    expect(storage.getItem('b')).toBeNull();
  });

  it('STO-03 shows a written value at once and writes it through', async () => {
    const { store, written } = createFakeStore();
    const storage = await StartupStorage.load(store, KEYS);

    storage.setItem('a', 'x');

    expect(storage.getItem('a')).toBe('x');
    expect(written).toEqual([['a', 'x']]);
  });

  it('STO-04 loads with nothing saved when reading fails', async () => {
    const store: AsyncKeyValueStore = {
      multiGet: () => Promise.reject(new Error('blocked')),
      setItem: () => Promise.resolve(),
    };

    const storage = await StartupStorage.load(store, KEYS);

    expect(storage.getItem('a')).toBeNull();
  });

  it('STO-05 keeps a value for the session when writing fails', async () => {
    const store: AsyncKeyValueStore = {
      multiGet: () => Promise.resolve([]),
      setItem: () => Promise.reject(new Error('full')),
    };
    const storage = await StartupStorage.load(store, KEYS);

    expect(() => {
      storage.setItem('a', 'x');
    }).not.toThrow();
    expect(storage.getItem('a')).toBe('x');
  });

  it('STO-06 gives the client ID provider a stored ID and stores a new one', async () => {
    const stored = '0b6c2a52-5c0e-4b1e-9c53-6f4d2f7a9b11';
    const first = createFakeStore({ 'nabd.clientId': stored });
    const reused = createClientIdProvider(
      await StartupStorage.load(first.store, ['nabd.clientId']),
      () => 'unused',
    );
    const second = createFakeStore();
    const created = createClientIdProvider(
      await StartupStorage.load(second.store, ['nabd.clientId']),
      () => '7d1f0f3a-0c35-4d6e-8a0e-2c8d0e3b6a55',
    );

    expect(reused()).toBe(stored);
    expect(created()).toBe('7d1f0f3a-0c35-4d6e-8a0e-2c8d0e3b6a55');
    expect(second.written).toEqual([['nabd.clientId', '7d1f0f3a-0c35-4d6e-8a0e-2c8d0e3b6a55']]);
  });
});
