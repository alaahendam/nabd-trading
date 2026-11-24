import { useEffect, useState } from 'react';

/** Start loading a little before the element is actually on screen, so scrolling feels seamless. */
const LOOK_AHEAD = '200px';

/**
 * Calls `onVisible` whenever the element it is attached to comes into view. Give it a stable
 * callback: a new one rebuilds the observer, which reports again at once. The element is kept in
 * state so the effect runs when it exists. Nothing is watched while `enabled` is false.
 */
export function useOnVisible(
  onVisible: () => void,
  enabled: boolean,
): (element: Element | null) => void {
  const [element, setElement] = useState<Element | null>(null);

  useEffect(() => {
    // Without observer support the button still works; it just does not load by itself.
    if (!enabled || element === null || typeof IntersectionObserver === 'undefined') {
      return undefined;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          onVisible();
        }
      },
      { rootMargin: LOOK_AHEAD },
    );
    observer.observe(element);
    return () => {
      observer.disconnect();
    };
  }, [enabled, element, onVisible]);

  return setElement;
}
