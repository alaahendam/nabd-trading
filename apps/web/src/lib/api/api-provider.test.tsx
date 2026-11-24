import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { ApiProvider, useApi } from './api-provider';
import type { Api } from './endpoints';

const fakeApi: Api = {
  listStocks: vi.fn(),
  getStock: vi.fn(),
  getHistory: vi.fn(),
  listWatchlist: vi.fn(),
  addToWatchlist: vi.fn(),
  removeFromWatchlist: vi.fn(),
};

describe('ApiProvider', () => {
  it('PRV-01 useApi returns the provided client', () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <ApiProvider api={fakeApi}>{children}</ApiProvider>
    );
    const { result } = renderHook(() => useApi(), { wrapper });
    expect(result.current).toBe(fakeApi);
  });

  it('PRV-02 useApi needs the provider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(() => renderHook(() => useApi())).toThrow(/ApiProvider/);
    spy.mockRestore();
  });
});
