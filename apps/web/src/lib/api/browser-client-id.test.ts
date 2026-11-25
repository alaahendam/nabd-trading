import { CLIENT_ID_STORAGE_KEY } from '@nabd/api-client';
import { describe, expect, it } from 'vitest';

import { createBrowserClientIdProvider } from './browser-client-id';

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
