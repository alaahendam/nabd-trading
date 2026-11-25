import { type Direction, directionOf, type Language } from '@nabd/i18n';
import type { i18n } from 'i18next';
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useSyncExternalStore,
} from 'react';
import { I18nextProvider } from 'react-i18next';

import type { LanguageStore } from './language-store';

const LanguageContext = createContext<LanguageStore | undefined>(undefined);

/** Gives the tree translations (react-i18next) and the language state and setter. */
export function I18nProvider({
  i18n,
  store,
  children,
}: {
  i18n: i18n;
  store: LanguageStore;
  children: ReactNode;
}) {
  return (
    <I18nextProvider i18n={i18n}>
      <LanguageContext value={store}>{children}</LanguageContext>
    </I18nextProvider>
  );
}

export function useLanguage(): {
  language: Language;
  direction: Direction;
  setLanguage: (language: Language) => void;
} {
  const store = useContext(LanguageContext);
  if (!store) {
    throw new Error('useLanguage must be used inside <I18nProvider>.');
  }
  const subscribe = useCallback((notify: () => void) => store.subscribe(notify), [store]);
  const { language } = useSyncExternalStore(subscribe, () => store.getState());
  const setLanguage = useCallback(
    (next: Language) => {
      store.setLanguage(next);
    },
    [store],
  );
  return { language, direction: directionOf(language), setLanguage };
}
