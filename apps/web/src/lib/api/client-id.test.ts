import { describe, expect, it, vi } from 'vitest';

import {
  CLIENT_ID_STORAGE_KEY,
  createBrowserClientIdProvider,
  createClientIdProvider,
} from './client-id';

const UUID = '3f2b8c1e-5a4d-4e6f-9b7a-1c2d3e4f5a6b';
const OTHER = '9a8b7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d';

const makeStorage = (initial?: string) => {
  const data = new Map<string, string>(
    initial === undefined ? [] : [[CLIENT_ID_STORAGE_KEY, initial]],
  );
  return {
    data,
    getItem: (key: string) => data.get(key) ?? null,
    setItem: vi.fn((key: string, value: string) => {
      data.set(key, value);
    }),
  };
};

describe('createClientIdProvider', () => {
  it('CID-01 reuses a stored UUID', () => {
    const storage = makeStorage(UUID);
    const generate = vi.fn(() => OTHER);
    expect(createClientIdProvider(storage, generate)()).toBe(UUID);
    expect(storage.setItem).not.toHaveBeenCalled();
    expect(generate).not.toHaveBeenCalled();
  });

  it('CID-02 generates and stores one when there is none', () => {
    const storage = makeStorage();
    expect(createClientIdProvider(storage, () => UUID)()).toBe(UUID);
    expect(storage.data.get(CLIENT_ID_STORAGE_KEY)).toBe(UUID);
  });

  it('CID-03 replaces a stored value that is not a UUID', () => {
    const storage = makeStorage('abc');
    expect(createClientIdProvider(storage, () => UUID)()).toBe(UUID);
    expect(storage.data.get(CLIENT_ID_STORAGE_KEY)).toBe(UUID);
  });

  it('CID-04 still returns a UUID when storage is blocked', () => {
    const blocked = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
    };
    expect(createClientIdProvider(blocked, () => UUID)()).toBe(UUID);
  });

  it('CID-05 returns the same ID every time, generating once', () => {
    const blocked = {
      getItem: () => null,
      setItem: () => {
        throw new Error('blocked');
      },
    };
    const generate = vi.fn(() => UUID);
    const provide = createClientIdProvider(blocked, generate);
    expect([provide(), provide(), provide()]).toEqual([UUID, UUID, UUID]);
    expect(generate).toHaveBeenCalledTimes(1);
  });
});

describe('createBrowserClientIdProvider', () => {
  it('CID-06 persists a real UUID in localStorage', () => {
    localStorage.clear();
    const id = createBrowserClientIdProvider()();
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    expect(localStorage.getItem(CLIENT_ID_STORAGE_KEY)).toBe(id);
    expect(createBrowserClientIdProvider()()).toBe(id);
    localStorage.clear();
  });
});
