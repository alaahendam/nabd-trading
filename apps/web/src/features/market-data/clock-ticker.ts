const TICK_MS = 1000;

const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | undefined;

/**
 * One shared once-a-second tick for everything that needs to notice time passing (staleness).
 * The timer only runs while someone listens, and it is a single timer however many rows listen.
 * Listeners only learn that a second passed; they read the time themselves.
 */
export function subscribeTick(listener: () => void): () => void {
  listeners.add(listener);
  timer ??= setInterval(() => {
    for (const current of [...listeners]) {
      current();
    }
  }, TICK_MS);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      clearInterval(timer);
      timer = undefined;
    }
  };
}
