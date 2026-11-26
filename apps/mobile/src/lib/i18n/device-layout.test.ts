import { reloadAppAsync } from 'expo';
import { DevSettings } from 'react-native';

import type * as DeviceLayoutModule from './device-layout';

// The module under test is replaced for every other test (see `jest.setup.ts`).
const { deviceLayout } = jest.requireActual<typeof DeviceLayoutModule>('./device-layout');

jest.mock('expo', () => ({ reloadAppAsync: jest.fn(() => Promise.resolve()) }));

const reloadNative = jest.mocked(reloadAppAsync);

/** `__DEV__` is a plain global that the bundler sets; a test sets it the same way. */
const setDev = (value: boolean) => {
  Object.defineProperty(globalThis, '__DEV__', { value, writable: true, configurable: true });
};

describe('deviceLayout.reload', () => {
  const originalDev = __DEV__;
  const reloadDevMenu = jest.spyOn(DevSettings, 'reload');

  beforeEach(() => {
    reloadNative.mockClear();
    reloadDevMenu.mockReset();
    reloadDevMenu.mockImplementation(() => undefined);
  });

  afterAll(() => {
    setDev(originalDev);
  });

  it('SWL-08 asks the native side first, then the dev menu, in development', async () => {
    setDev(true);

    await deviceLayout.reload();

    expect(reloadNative).toHaveBeenCalledTimes(1);
    expect(reloadDevMenu).toHaveBeenCalledTimes(1);
  });

  it('SWL-08 uses only the native reload outside development', async () => {
    setDev(false);

    await deviceLayout.reload();

    expect(reloadNative).toHaveBeenCalledTimes(1);
    expect(reloadDevMenu).not.toHaveBeenCalled();
  });
});
