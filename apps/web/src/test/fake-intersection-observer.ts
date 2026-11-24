import { vi } from 'vitest';

/**
 * jsdom has no IntersectionObserver. This installs one the test controls: it records what is
 * observed and lets the test report that an element scrolled into or out of view. Remove it with
 * `vi.unstubAllGlobals()`.
 */
export function installFakeIntersectionObserver() {
  const instances: FakeIntersectionObserver[] = [];

  class FakeIntersectionObserver {
    readonly observed: Element[] = [];
    disconnected = false;

    constructor(private readonly callback: IntersectionObserverCallback) {
      instances.push(this);
    }

    observe(element: Element) {
      this.observed.push(element);
    }

    unobserve() {
      return undefined;
    }

    disconnect() {
      this.disconnected = true;
    }

    takeRecords() {
      return [];
    }

    report(isIntersecting: boolean) {
      const entry = { isIntersecting } as IntersectionObserverEntry;
      this.callback([entry], this as unknown as IntersectionObserver);
    }
  }

  vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver);

  return {
    instances,
    /** The observers still watching, newest last. */
    live: () => instances.filter((observer) => !observer.disconnected),
  };
}
