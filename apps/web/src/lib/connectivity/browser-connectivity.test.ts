import { afterEach, describe, expect, it, vi } from 'vitest';

import { browserConnectivity } from './browser-connectivity';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('browserConnectivity', () => {
  it('NET-01 reports navigator.onLine', () => {
    const onLine = vi.spyOn(navigator, 'onLine', 'get');
    onLine.mockReturnValue(true);
    expect(browserConnectivity.isOnline()).toBe(true);
    onLine.mockReturnValue(false);
    expect(browserConnectivity.isOnline()).toBe(false);
  });

  it('NET-02 passes the online and offline events to the listener', () => {
    const heard: boolean[] = [];
    const stop = browserConnectivity.subscribe((online) => heard.push(online));

    window.dispatchEvent(new Event('offline'));
    window.dispatchEvent(new Event('online'));
    expect(heard).toEqual([false, true]);
    stop();
  });

  it('NET-03 stops listening when asked to', () => {
    const listener = vi.fn();
    const stop = browserConnectivity.subscribe(listener);
    stop();

    window.dispatchEvent(new Event('offline'));
    window.dispatchEvent(new Event('online'));
    expect(listener).not.toHaveBeenCalled();
  });
});
