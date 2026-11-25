import { Appearance } from 'react-native';

/** The device's light or dark mode, from React Native's `Appearance`. */
export const deviceScheme = {
  systemPrefersDark: () => Appearance.getColorScheme() === 'dark',
  subscribeSystem: (listener: () => void) => {
    const subscription = Appearance.addChangeListener(listener);
    return () => {
      subscription.remove();
    };
  },
};
