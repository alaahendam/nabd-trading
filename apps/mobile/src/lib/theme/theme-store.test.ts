import { resolveToken } from '@nabd/tokens';

import { type ThemeEnvironment, ThemeStore } from './theme-store';

function createEnvironment(saved: string | null, dark: boolean) {
  const written: [string, string][] = [];
  let systemDark = dark;
  const listeners = new Set<() => void>();
  const environment: ThemeEnvironment = {
    storage: {
      getItem: () => saved,
      setItem: (key, value) => {
        written.push([key, value]);
      },
    },
    systemPrefersDark: () => systemDark,
    subscribeSystem: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
  return {
    environment,
    written,
    listenerCount: () => listeners.size,
    changeSystem(next: boolean) {
      systemDark = next;
      for (const listener of listeners) listener();
    },
  };
}

const countCalls = (store: ThemeStore) => {
  const calls = { count: 0 };
  store.subscribe(() => {
    calls.count += 1;
  });
  return calls;
};

describe('ThemeStore', () => {
  it.each([null, 'purple', ''])('THM-01 treats the saved value %j as system', (saved) => {
    const { environment } = createEnvironment(saved, false);

    expect(new ThemeStore(environment).getState().preference).toBe('system');
  });

  it('THM-02 resolves system to the device scheme and follows it', () => {
    const fake = createEnvironment(null, false);
    const store = new ThemeStore(fake.environment);
    const calls = countCalls(store);

    expect(store.getState().resolved).toBe('light');
    fake.changeSystem(true);

    expect(store.getState().resolved).toBe('dark');
    expect(calls.count).toBe(1);
  });

  it.each(['light', 'dark'] as const)('THM-03 ignores the device scheme for %s', (preference) => {
    const fake = createEnvironment(preference, preference === 'light');
    const store = new ThemeStore(fake.environment);
    const calls = countCalls(store);

    fake.changeSystem(preference === 'light');

    expect(store.getState().resolved).toBe(preference);
    expect(calls.count).toBe(0);
  });

  it('THM-04 saves the preference and notifies once', () => {
    const fake = createEnvironment(null, false);
    const store = new ThemeStore(fake.environment);
    const calls = countCalls(store);

    store.setPreference('dark');

    expect(fake.written).toEqual([['nabd.theme', 'dark']]);
    expect(store.getState()).toEqual({ preference: 'dark', resolved: 'dark' });
    expect(calls.count).toBe(1);
  });

  it('THM-05 does not notify or save when the preference is unchanged', () => {
    const fake = createEnvironment('dark', false);
    const store = new ThemeStore(fake.environment);
    const calls = countCalls(store);

    store.setPreference('dark');

    expect(calls.count).toBe(0);
    expect(fake.written).toEqual([]);
  });

  it('stops notifying a listener that left, and stops watching the device when disposed', () => {
    const fake = createEnvironment(null, false);
    const store = new ThemeStore(fake.environment);
    const calls = { count: 0 };
    const stop = store.subscribe(() => {
      calls.count += 1;
    });

    stop();
    store.setPreference('dark');
    store.dispose();

    expect(calls.count).toBe(0);
    expect(fake.listenerCount()).toBe(0);
  });

  it('THM-06 the two themes have different tokens to resolve', () => {
    expect(resolveToken('dark', 'surface')).not.toBe(resolveToken('light', 'surface'));
  });
});
