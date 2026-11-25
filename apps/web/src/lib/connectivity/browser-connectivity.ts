import type { Connectivity } from '@nabd/market-data';

/** Connectivity from the browser: `navigator.onLine` and the window's `online` and `offline` events. */
export const browserConnectivity: Connectivity = {
  isOnline: () => navigator.onLine,
  subscribe: (listener) => {
    const goOnline = () => {
      listener(true);
    };
    const goOffline = () => {
      listener(false);
    };
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  },
};
