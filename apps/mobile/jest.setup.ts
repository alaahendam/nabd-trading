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
