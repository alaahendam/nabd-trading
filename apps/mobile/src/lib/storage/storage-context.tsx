import { createContext, type ReactNode, use } from 'react';

import type { StartupStorage } from './startup-storage';

const StorageContext = createContext<StartupStorage | undefined>(undefined);

/** The saved values, for the few screens that change one (the language). */
export function StorageProvider({
  storage,
  children,
}: {
  storage: StartupStorage;
  children: ReactNode;
}) {
  return <StorageContext value={storage}>{children}</StorageContext>;
}

export function useStorage(): StartupStorage {
  const storage = use(StorageContext);
  if (storage === undefined) throw new Error('useStorage must be used inside a StorageProvider');
  return storage;
}
