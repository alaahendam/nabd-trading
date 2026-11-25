import {
  createNetworkConnectivity,
  type NetworkSource,
  type NetworkStateLike,
} from './network-connectivity';

function createSource(initial: NetworkStateLike) {
  let listener: ((state: NetworkStateLike) => void) | undefined;
  const calls = { added: 0, removed: 0 };
  const source: NetworkSource = {
    getState: () => Promise.resolve(initial),
    addListener: (next) => {
      calls.added += 1;
      listener = next;
      return {
        remove: () => {
          calls.removed += 1;
          listener = undefined;
        },
      };
    },
  };
  return { source, calls, emit: (state: NetworkStateLike) => listener?.(state) };
}

const settle = () => new Promise<void>((resolve) => setImmediate(resolve));

describe('createNetworkConnectivity', () => {
  it.each([
    [{ isConnected: true, isInternetReachable: true }, true],
    [{ isConnected: false, isInternetReachable: false }, false],
    [{ isConnected: true, isInternetReachable: false }, false],
    [{ isConnected: false, isInternetReachable: true }, false],
  ])('NET-01 reports %j as online: %s', (state, expected) => {
    const fake = createSource({});
    const connectivity = createNetworkConnectivity(fake.source);
    connectivity.subscribe(() => undefined);

    fake.emit(state);

    expect(connectivity.isOnline()).toBe(expected);
  });

  it('NET-02 counts an unknown reachability as online', () => {
    const fake = createSource({});
    const connectivity = createNetworkConnectivity(fake.source);
    connectivity.subscribe(() => undefined);

    fake.emit({ isConnected: true, isInternetReachable: undefined });

    expect(connectivity.isOnline()).toBe(true);
  });

  it('NET-02 assumes online before the device has said anything', () => {
    expect(createNetworkConnectivity(createSource({}).source).isOnline()).toBe(true);
  });

  it('NET-03 notifies on changes only, and stops after unsubscribing', () => {
    const fake = createSource({});
    const connectivity = createNetworkConnectivity(fake.source);
    const seen: boolean[] = [];
    const stop = connectivity.subscribe((online) => {
      seen.push(online);
    });

    fake.emit({ isConnected: true });
    fake.emit({ isConnected: false });
    fake.emit({ isConnected: false });
    fake.emit({ isConnected: true });
    stop();
    fake.emit({ isConnected: false });

    expect(seen).toEqual([false, true]);
    expect(fake.calls).toEqual({ added: 1, removed: 1 });
  });

  it('NET-03 asks the device for its current state when the first listener arrives', async () => {
    const fake = createSource({ isConnected: false, isInternetReachable: false });
    const connectivity = createNetworkConnectivity(fake.source);
    const seen: boolean[] = [];

    connectivity.subscribe((online) => {
      seen.push(online);
    });
    await settle();

    expect(seen).toEqual([false]);
    expect(connectivity.isOnline()).toBe(false);
  });

  it('NET-03 keeps listening for the second listener and listens again after all left', () => {
    const fake = createSource({});
    const connectivity = createNetworkConnectivity(fake.source);

    const stopFirst = connectivity.subscribe(() => undefined);
    const stopSecond = connectivity.subscribe(() => undefined);
    stopFirst();
    stopSecond();
    connectivity.subscribe(() => undefined);

    expect(fake.calls).toEqual({ added: 2, removed: 1 });
  });

  it('survives a device that cannot report its state', async () => {
    const fake = createSource({});
    const source: NetworkSource = {
      ...fake.source,
      getState: () => Promise.reject(new Error('unavailable')),
    };
    const connectivity = createNetworkConnectivity(source);

    connectivity.subscribe(() => undefined);
    await settle();

    expect(connectivity.isOnline()).toBe(true);
  });
});
