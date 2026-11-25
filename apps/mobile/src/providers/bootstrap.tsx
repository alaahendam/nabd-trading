import { hideAsync, preventAutoHideAsync } from 'expo-splash-screen';
import { type ReactNode, useEffect, useState } from 'react';

/**
 * Keeps the splash screen up. Call it when the module loads, before anything renders: Expo's
 * guidance, because the splash would otherwise hide itself on the first render.
 */
export function holdSplash(): void {
  preventAutoHideAsync().catch(() => undefined);
}

/**
 * Shows nothing (the splash screen stays up) until `prepare` has resolved, then renders the app
 * with what it prepared and hides the splash. So the first frame the user sees already has the
 * right theme, language and fonts. `prepare` must not reject (see `prepareApp`).
 */
export function Bootstrap<T>({
  prepare,
  children,
}: {
  prepare: () => Promise<T>;
  children: (prepared: T) => ReactNode;
}) {
  const [prepared, setPrepared] = useState<{ value: T } | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    void prepare().then((value) => {
      if (!cancelled) {
        setPrepared({ value });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [prepare]);

  const ready = prepared !== undefined;
  useEffect(() => {
    if (ready) {
      hideAsync().catch(() => undefined);
    }
  }, [ready]);

  return ready ? children(prepared.value) : null;
}
