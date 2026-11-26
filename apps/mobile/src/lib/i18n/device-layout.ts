import { reloadAppAsync } from 'expo';
import { I18nManager } from 'react-native';

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
  reload: () => reloadAppAsync(),
};

export type DeviceLayout = typeof deviceLayout;
