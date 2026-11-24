import { act, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { installFakeIntersectionObserver } from '../../test/fake-intersection-observer';
import { useOnVisible } from './use-on-visible';

function Probe({ onVisible, enabled }: { onVisible: () => void; enabled: boolean }) {
  const ref = useOnVisible(onVisible, enabled);
  return <div ref={ref}>watched</div>;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('useOnVisible', () => {
  it('OBS-01 calls back when the element comes into view', () => {
    const observers = installFakeIntersectionObserver();
    const onVisible = vi.fn();
    render(<Probe onVisible={onVisible} enabled />);

    const [observer] = observers.live();
    expect(observer?.observed).toHaveLength(1);
    act(() => {
      observer?.report(true);
    });
    expect(onVisible).toHaveBeenCalledTimes(1);
    act(() => {
      observer?.report(true);
    });
    expect(onVisible).toHaveBeenCalledTimes(2);
  });

  it('OBS-02 ignores a report that the element is not in view', () => {
    const observers = installFakeIntersectionObserver();
    const onVisible = vi.fn();
    render(<Probe onVisible={onVisible} enabled />);

    act(() => {
      observers.live()[0]?.report(false);
    });
    expect(onVisible).not.toHaveBeenCalled();
  });

  it('OBS-03 watches nothing while disabled, and starts when enabled', () => {
    const observers = installFakeIntersectionObserver();
    const onVisible = vi.fn();
    const { rerender } = render(<Probe onVisible={onVisible} enabled={false} />);
    expect(observers.instances).toHaveLength(0);

    rerender(<Probe onVisible={onVisible} enabled />);
    expect(observers.live()).toHaveLength(1);
  });

  it('OBS-04 stops watching when it is disabled or removed', () => {
    const observers = installFakeIntersectionObserver();
    const onVisible = vi.fn();
    const { rerender, unmount } = render(<Probe onVisible={onVisible} enabled />);
    const [observer] = observers.live();

    rerender(<Probe onVisible={onVisible} enabled={false} />);
    expect(observer?.disconnected).toBe(true);

    rerender(<Probe onVisible={onVisible} enabled />);
    const [again] = observers.live();
    unmount();
    expect(again?.disconnected).toBe(true);
  });
});

describe('useOnVisible without observer support', () => {
  it('OBS-05 watches nothing and does not throw when the environment has no IntersectionObserver', () => {
    vi.stubGlobal('IntersectionObserver', undefined);
    const onVisible = vi.fn();
    expect(() => render(<Probe onVisible={onVisible} enabled />)).not.toThrow();
    expect(onVisible).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
});
