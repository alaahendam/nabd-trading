import { act, renderHook } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { ThemeProvider, useTheme } from './theme-provider';
import { ThemeStore } from './theme-store';

const createStore = () =>
  new ThemeStore({
    storage: { getItem: () => null, setItem: () => undefined },
    systemPrefersDark: () => false,
    subscribeSystem: () => () => undefined,
  });

describe('ThemeProvider', () => {
  it('THM-06 gives the colors of the resolved theme and a way to change the preference', async () => {
    const store = createStore();
    const wrapper = ({ children }: { children: ReactNode }) => (
      <ThemeProvider store={store}>{children}</ThemeProvider>
    );
    const { result } = await renderHook(() => useTheme(), { wrapper });
    const lightBackground = result.current.colors.background;

    await act(() => {
      result.current.setPreference('dark');
    });

    expect(result.current.resolved).toBe('dark');
    expect(result.current.colors.background).not.toBe(lightBackground);
  });

  it('fails clearly outside a provider', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);

    await expect(renderHook(() => useTheme())).rejects.toThrow('inside a ThemeProvider');
  });
});
