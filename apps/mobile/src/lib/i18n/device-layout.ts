import { reloadAppAsync } from 'expo';
import { DevSettings, I18nManager } from 'react-native';

/**
 * Reloads the app. The native reload comes first. `reloadAppAsync` does nothing, and says nothing,
 * when the host has no native function for it, which is the case in Expo Go; so in development the
 * dev menu's reload follows. If the native one did reload, this never gets that far.
 */
async function reload(): Promise<void> {
  await reloadAppAsync();
  if (__DEV__) {
    DevSettings.reload();
  }
}

/**
 * What changing the language needs from the device: the layout direction, which the native side
 * keeps until the app reloads, and the reload itself. Tests replace this module.
 */
export const deviceLayout = {
  allowRTL: (allow: boolean) => {
    I18nManager.allowRTL(allow);
  },
  forceRTL: (force: boolean) => {
    I18nManager.forceRTL(force);
  },
  reload,
};

export type DeviceLayout = typeof deviceLayout;
