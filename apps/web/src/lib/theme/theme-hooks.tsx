import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useSyncExternalStore,
} from 'react';

import type { ThemePreference, ThemeState, ThemeStore } from './theme';

const ThemeContext = createContext<ThemeStore | undefined>(undefined);

export function ThemeProvider({ store, children }: { store: ThemeStore; children: ReactNode }) {
  return <ThemeContext value={store}>{children}</ThemeContext>;
}

export function useTheme(): ThemeState & { setPreference: (preference: ThemePreference) => void } {
  const store = useContext(ThemeContext);
  if (!store) {
    throw new Error('useTheme must be used inside <ThemeProvider>.');
  }
  const subscribe = useCallback((notify: () => void) => store.subscribe(notify), [store]);
  const state = useSyncExternalStore(subscribe, () => store.getState());
  const setPreference = useCallback(
    (preference: ThemePreference) => {
      store.setPreference(preference);
    },
    [store],
  );
  return { ...state, setPreference };
}
