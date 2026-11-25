import { render, screen, waitFor } from '@testing-library/react-native';
import { hideAsync, preventAutoHideAsync } from 'expo-splash-screen';
import { Text } from 'react-native';

import { Bootstrap, holdSplash } from './bootstrap';
import { prepareApp } from './prepare-app';

jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn(() => Promise.resolve(true)),
  hideAsync: jest.fn(() => Promise.resolve()),
}));

const emptyStore = {
  multiGet: () => Promise.resolve([] as const),
  setItem: () => Promise.resolve(),
};

beforeEach(() => {
  jest.mocked(hideAsync).mockClear();
  jest.mocked(preventAutoHideAsync).mockClear();
});

describe('Bootstrap', () => {
  it('BOOT-01 keeps the splash screen visible from the start', () => {
    holdSplash();

    expect(preventAutoHideAsync).toHaveBeenCalledTimes(1);
  });

  it('BOOT-02 renders nothing until what it prepares is ready', async () => {
    let finish: (value: string) => void = () => undefined;
    const prepare = () =>
      new Promise<string>((resolve) => {
        finish = resolve;
      });

    await render(<Bootstrap prepare={prepare}>{(value) => <Text>{value}</Text>}</Bootstrap>);

    expect(screen.queryByText('ready')).not.toBeOnTheScreen();
    expect(hideAsync).not.toHaveBeenCalled();
    finish('ready');
    expect(await screen.findByText('ready')).toBeOnTheScreen();
  });

  it('BOOT-03 renders the children and hides the splash once when ready', async () => {
    const prepare = () => Promise.resolve('ready');

    await render(<Bootstrap prepare={prepare}>{(value) => <Text>{value}</Text>}</Bootstrap>);

    expect(await screen.findByText('ready')).toBeOnTheScreen();
    await waitFor(() => {
      expect(hideAsync).toHaveBeenCalledTimes(1);
    });
  });

  it('BOOT-04 still starts when the fonts fail to load', async () => {
    const prepare = () =>
      prepareApp({ store: emptyStore, loadFonts: () => Promise.reject(new Error('no font')) });

    await render(
      <Bootstrap prepare={prepare}>
        {(prepared) => <Text>{prepared.storage.getItem('x') ?? 'empty'}</Text>}
      </Bootstrap>,
    );

    expect(await screen.findByText('empty')).toBeOnTheScreen();
    await waitFor(() => {
      expect(hideAsync).toHaveBeenCalledTimes(1);
    });
  });
  it('BOOT-05 does nothing when it is left before it is ready', async () => {
    let finish: (value: string) => void = () => undefined;
    const prepare = () =>
      new Promise<string>((resolve) => {
        finish = resolve;
      });
    const view = await render(
      <Bootstrap prepare={prepare}>{(value) => <Text>{value}</Text>}</Bootstrap>,
    );

    await view.unmount();
    finish('late');
    await Promise.resolve();

    expect(hideAsync).not.toHaveBeenCalled();
  });
});
