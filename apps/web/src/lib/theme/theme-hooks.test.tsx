import { act, render, renderHook, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { ThemeStore } from './theme';
import { ThemeProvider, useTheme } from './theme-hooks';

const makeStore = () => {
  const data = new Map<string, string>();
  const root = { dataset: {} as DOMStringMap };
  const store = new ThemeStore({
    storage: {
      getItem: (key) => data.get(key) ?? null,
      setItem: (key, value) => {
        data.set(key, value);
      },
    },
    matchMedia: () => ({
      matches: false,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    }),
    root,
  });
  return { store, root };
};

describe('ThemeProvider and useTheme', () => {
  it('THM-11 shows the state and follows changes', () => {
    const { store, root } = makeStore();
    const Probe = () => {
      const { preference, resolved, setPreference } = useTheme();
      return (
        <button
          type="button"
          onClick={() => {
            setPreference('dark');
          }}
        >
          {preference}/{resolved}
        </button>
      );
    };
    render(
      <ThemeProvider store={store}>
        <Probe />
      </ThemeProvider>,
    );
    expect(screen.getByRole('button')).toHaveTextContent('system/light');

    act(() => {
      screen.getByRole('button').click();
    });
    expect(screen.getByRole('button')).toHaveTextContent('dark/dark');
    expect(root.dataset['theme']).toBe('dark');
  });

  it('THM-11 hands out the same setter on every render', () => {
    const { store } = makeStore();
    const wrapper = ({ children }: { children: ReactNode }) => (
      <ThemeProvider store={store}>{children}</ThemeProvider>
    );
    const { result, rerender } = renderHook(() => useTheme(), { wrapper });
    const first = result.current.setPreference;
    rerender();
    expect(result.current.setPreference).toBe(first);
  });

  it('THM-12 useTheme needs the provider', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(() => renderHook(() => useTheme())).toThrow(/ThemeProvider/);
    error.mockRestore();
  });
});
