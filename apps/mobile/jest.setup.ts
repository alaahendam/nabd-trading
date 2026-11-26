import { configure } from '@testing-library/react-native';

// AsyncStorage needs the device's native module; its own in-memory mock stands in for it.
jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual<object>('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// The device's network state is not there either: report a working connection, and hand back a
// subscription that can be removed, as the real module does.
jest.mock('expo-network', () => ({
  getNetworkStateAsync: () => Promise.resolve({ isConnected: true, isInternetReachable: true }),
  addNetworkStateListener: () => ({ remove: () => undefined }),
}));

// Nor is the device's random source: a counter makes valid, predictable IDs.
jest.mock('expo-crypto', () => {
  let count = 0;
  return {
    randomUUID: () => {
      count += 1;
      return `00000000-0000-4000-8000-${String(count).padStart(12, '0')}`;
    },
  };
});

// FlashList measures its layout on the device; this gives it a fixed phone-sized one.
jest.requireActual<object>('@shopify/flash-list/jestSetup');

// `findBy…` and `waitFor` wait one second by default. A screen that loads a stock and then its
// chart needs more than that when the other workspaces' tests are using the machine too.
configure({ asyncUtilTimeout: 5000 });

// The device's vibration motor is not there; a recorder stands in, so a test can see the tap.
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Light: 'light' },
}));
