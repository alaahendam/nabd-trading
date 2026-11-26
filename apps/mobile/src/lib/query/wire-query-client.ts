import type { Connectivity } from '@nabd/market-data';
import { focusManager, onlineManager } from '@tanstack/react-query';
import type { AppStateStatus } from 'react-native';

/** The part of React Native's `AppState` the app uses. */
export interface AppStateLike {
  addEventListener(type: 'change', listener: (state: AppStateStatus) => void): { remove(): void };
}

/**
 * Teaches TanStack Query what "focused" and "online" mean on a phone, where there is no window
 * and no `online` event: the app is focused while it is `active`, and online as the device says.
 * (On the web the library uses the page's visibility and the browser's events.)
 */
export function wireQueryClient({
  appState,
  connectivity,
}: {
  appState: AppStateLike;
  connectivity: Connectivity;
}): void {
  focusManager.setEventListener((handleFocus) => {
    const subscription = appState.addEventListener('change', (state) => {
      handleFocus(state === 'active');
    });
    return () => {
      subscription.remove();
    };
  });
  onlineManager.setEventListener((setOnline) => {
    setOnline(connectivity.isOnline());
    return connectivity.subscribe(setOnline);
  });
}
