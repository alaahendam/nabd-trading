// AsyncStorage needs the device's native module; its own in-memory mock stands in for it.
jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual<object>('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
