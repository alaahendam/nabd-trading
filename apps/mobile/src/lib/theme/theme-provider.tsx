import { createContext, type ReactNode, use, useMemo, useSyncExternalStore } from 'react';

import { type Colors, createColors } from './theme';
import type { ResolvedTheme, ThemePreference, ThemeStore } from './theme-store';

interface ThemeValue {
  preference: ThemePreference;
  resolved: ResolvedTheme;
  colors: Colors;
  setPreference: (preference: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeValue | undefined>(undefined);

export function ThemeProvider({ store, children }: { store: ThemeStore; children: ReactNode }) {
  const state = useSyncExternalStore(
    (notify) => store.subscribe(notify),
    () => store.getState(),
  );
  const value = useMemo<ThemeValue>(
    () => ({
      preference: state.preference,
      resolved: state.resolved,
      colors: createColors(state.resolved),
      setPreference: (preference) => {
        store.setPreference(preference);
      },
    }),
    [state, store],
  );
  return <ThemeContext value={value}>{children}</ThemeContext>;
}

export function useTheme(): ThemeValue {
  const value = use(ThemeContext);
  if (value === undefined) throw new Error('useTheme must be used inside a ThemeProvider');
  return value;
}
