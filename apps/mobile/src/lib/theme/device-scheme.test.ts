import { Appearance } from 'react-native';

import { deviceScheme } from './device-scheme';

afterEach(() => {
  jest.restoreAllMocks();
});

describe('deviceScheme', () => {
  it('THM-02 reports dark only when the device is in dark mode', () => {
    const scheme = jest.spyOn(Appearance, 'getColorScheme');

    scheme.mockReturnValue('dark');
    expect(deviceScheme.systemPrefersDark()).toBe(true);
    scheme.mockReturnValue('light');
    expect(deviceScheme.systemPrefersDark()).toBe(false);
    scheme.mockReturnValue(null);
    expect(deviceScheme.systemPrefersDark()).toBe(false);
  });

  it('THM-02 listens to changes of the device scheme until stopped', () => {
    const removed = { count: 0 };
    const listen = jest.spyOn(Appearance, 'addChangeListener').mockReturnValue({
      remove: () => {
        removed.count += 1;
      },
    });
    const listener = () => undefined;

    const stop = deviceScheme.subscribeSystem(listener);
    stop();

    expect(listen).toHaveBeenCalledWith(listener);
    expect(removed.count).toBe(1);
  });
});
