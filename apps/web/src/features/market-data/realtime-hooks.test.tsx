import { act, render, renderHook, screen } from '@testing-library/react';
import { type ReactNode, StrictMode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { FakeSocket } from '../../test/fake-socket';
import { PriceStore } from './price-store';
import { RealtimeClient } from './realtime-client';
import {
  RealtimeProvider,
  useConnectionStatus,
  useFreshness,
  useLivePrice,
  useSubscription,
} from './realtime-hooks';

const tick = (symbol: string, price: number, timestamp: number) => ({
  symbol,
  price,
  volume: 1,
  timestamp,
});

/** A client over a fake socket whose animation frames only run when the test says so. */
const setup = () => {
  const socket = new FakeSocket();
  const frames: (() => void)[] = [];
  const store = new PriceStore({
    schedule: (callback) => {
      frames.push(callback);
      return () => {
        frames.splice(frames.indexOf(callback), 1);
      };
    },
  });
  const client = new RealtimeClient(socket, store);
  const publish = (ticks: ReturnType<typeof tick>[]) => {
    act(() => {
      store.apply(ticks);
      for (const frame of frames.splice(0)) {
        frame();
      }
    });
  };
  const wrapper = ({ children }: { children: ReactNode }) => (
    <RealtimeProvider client={client}>{children}</RealtimeProvider>
  );
  return { socket, store, client, publish, wrapper };
};

/** Runs an action and lets the client's once-per-tick reconcile (a microtask) happen. */
const flush = async (action: () => void) => {
  await act(async () => {
    action();
    await Promise.resolve();
  });
};

const connect = (socket: FakeSocket) => {
  act(() => {
    socket.simulateConnect();
  });
};

describe('useLivePrice', () => {
  it('HK-01 follows the store', () => {
    const { wrapper, publish } = setup();
    const { result } = renderHook(() => useLivePrice('AAPL'), { wrapper });
    expect(result.current).toBeUndefined();

    publish([tick('AAPL', 100.5, 1)]);
    expect(result.current?.price).toBe(100.5);

    publish([tick('AAPL', 101, 2)]);
    expect(result.current).toMatchObject({ price: 101, previousPrice: 100.5 });
  });

  it('HK-02 re-renders only the component of the symbol that changed', () => {
    const { wrapper, publish } = setup();
    const renders = { aapl: 0, msft: 0 };
    const Aapl = () => {
      renders.aapl += 1;
      return <p>{useLivePrice('AAPL')?.price}</p>;
    };
    const Msft = () => {
      renders.msft += 1;
      return <p>{useLivePrice('MSFT')?.price}</p>;
    };
    render(
      <>
        <Aapl />
        <Msft />
      </>,
      { wrapper },
    );
    const before = { ...renders };

    publish([tick('AAPL', 100, 1)]);

    expect(renders.aapl).toBeGreaterThan(before.aapl);
    expect(renders.msft).toBe(before.msft);
  });
});

describe('useSubscription', () => {
  const Probe = ({ symbols }: { symbols: string[] }) => {
    useSubscription(symbols);
    return null;
  };

  it('HK-03 acquires on mount, leaves unchanged symbols alone on change, and releases on unmount', async () => {
    const { wrapper, socket } = setup();
    const { rerender } = render(<Probe symbols={['AAPL', 'MSFT']} />, { wrapper });
    connect(socket);
    expect(socket.calls.subscribe).toEqual([['AAPL', 'MSFT']]);

    await flush(() => {
      rerender(<Probe symbols={['MSFT', 'NVDA']} />);
    });
    expect(socket.calls.subscribe).toEqual([['AAPL', 'MSFT'], ['NVDA']]);
    expect(socket.calls.unsubscribe).toEqual([['AAPL']]);

    await flush(() => {
      rerender(<></>);
    });
    expect(socket.calls.unsubscribe).toEqual([['AAPL'], ['MSFT', 'NVDA']]);
  });

  it('HK-03 treats the same symbols in another order as no change', async () => {
    const { wrapper, socket } = setup();
    const { rerender } = render(<Probe symbols={['AAPL', 'MSFT']} />, { wrapper });
    connect(socket);

    await flush(() => {
      rerender(<Probe symbols={['MSFT', 'AAPL']} />);
    });
    expect(socket.calls.subscribe).toEqual([['AAPL', 'MSFT']]);
    expect(socket.calls.unsubscribe).toEqual([]);
  });

  it('HK-03 subscribes to nothing for an empty list', async () => {
    const { wrapper, socket } = setup();
    render(<Probe symbols={[]} />, { wrapper });
    connect(socket);
    await flush(() => undefined);
    expect(socket.calls.subscribe).toEqual([]);
  });

  it('HK-04 is safe under StrictMode', async () => {
    const { client, socket } = setup();
    const wrapper = ({ children }: { children: ReactNode }) => (
      <StrictMode>
        <RealtimeProvider client={client}>{children}</RealtimeProvider>
      </StrictMode>
    );
    const { rerender } = render(<Probe symbols={['AAPL']} />, { wrapper });
    connect(socket);
    await flush(() => undefined);
    expect(socket.calls.subscribe).toEqual([['AAPL']]);

    await flush(() => {
      rerender(<></>);
    });
    expect(socket.calls.unsubscribe).toEqual([['AAPL']]);
  });
});

describe('useConnectionStatus', () => {
  it('HK-05 follows the client', () => {
    const { wrapper, socket } = setup();
    const { result } = renderHook(() => useConnectionStatus(), { wrapper });
    expect(result.current).toBe('connecting');

    connect(socket);
    expect(result.current).toBe('connected');

    act(() => {
      socket.simulateDisconnect('transport close');
    });
    expect(result.current).toBe('reconnecting');
  });
});

describe('useFreshness', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(1_000_000));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('HK-06 ages with time and is stale at once when not connected', () => {
    const { wrapper, socket, publish } = setup();
    const { result } = renderHook(() => useFreshness('AAPL'), { wrapper });
    connect(socket);
    expect(result.current).toBe('none');

    publish([tick('AAPL', 100, 1)]);
    expect(result.current).toBe('fresh');

    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(result.current).toBe('fresh');

    act(() => {
      vi.advanceTimersByTime(6000);
    });
    expect(result.current).toBe('stale');

    publish([tick('AAPL', 101, 2)]);
    expect(result.current).toBe('fresh');

    act(() => {
      socket.simulateDisconnect('transport close');
    });
    expect(result.current).toBe('stale');
  });

  it('HK-06 honours a custom threshold', () => {
    const { wrapper, socket, publish } = setup();
    const { result } = renderHook(() => useFreshness('AAPL', 2000), { wrapper });
    connect(socket);
    publish([tick('AAPL', 100, 1)]);
    expect(result.current).toBe('fresh');

    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(result.current).toBe('stale');
  });

  it('HK-06 re-renders only when the freshness changes, not every second', () => {
    const { wrapper, socket, publish } = setup();
    let renders = 0;
    renderHook(
      () => {
        renders += 1;
        return useFreshness('AAPL');
      },
      { wrapper },
    );
    connect(socket);
    publish([tick('AAPL', 100, 1)]);
    const before = renders;

    act(() => {
      vi.advanceTimersByTime(4000);
    });
    expect(renders).toBe(before);
  });
});

describe('RealtimeProvider', () => {
  it('HK-07 connects on mount and disconnects on unmount', () => {
    const { client, socket } = setup();
    const { unmount } = render(<RealtimeProvider client={client}>content</RealtimeProvider>);
    expect(screen.getByText('content')).toBeInTheDocument();
    expect(socket.calls.connect).toBe(1);

    unmount();
    expect(socket.calls.disconnect).toBe(1);
  });

  it('HK-07 passes browser online and offline events to the client', () => {
    const { client, socket } = setup();
    render(<RealtimeProvider client={client}>content</RealtimeProvider>);
    connect(socket);

    act(() => {
      window.dispatchEvent(new Event('offline'));
    });
    expect(client.getStatus()).toBe('offline');

    act(() => {
      socket.simulateDisconnect('transport close');
      window.dispatchEvent(new Event('online'));
    });
    expect(client.getStatus()).toBe('reconnecting');
    expect(socket.calls.connect).toBe(2);
  });

  it('HK-07 stops listening to browser events on unmount', () => {
    const { client } = setup();
    const { unmount } = render(<RealtimeProvider client={client}>content</RealtimeProvider>);
    unmount();

    const setBrowserOnline = vi.spyOn(client, 'setBrowserOnline');
    window.dispatchEvent(new Event('offline'));
    window.dispatchEvent(new Event('online'));
    expect(setBrowserOnline).not.toHaveBeenCalled();
  });

  it('HK-07 starts offline when the browser already is', () => {
    const { client } = setup();
    const onLine = vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    render(<RealtimeProvider client={client}>content</RealtimeProvider>);
    expect(client.getStatus()).toBe('offline');
    onLine.mockRestore();
  });
});

describe('hooks outside the provider', () => {
  it('HK-08 fail with a clear message', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(() => renderHook(() => useConnectionStatus())).toThrow(/RealtimeProvider/);
    expect(() => renderHook(() => useLivePrice('AAPL'))).toThrow(/RealtimeProvider/);
    expect(() =>
      renderHook(() => {
        useSubscription(['AAPL']);
      }),
    ).toThrow(/RealtimeProvider/);
    expect(() => renderHook(() => useFreshness('AAPL'))).toThrow(/RealtimeProvider/);
    error.mockRestore();
  });
});
