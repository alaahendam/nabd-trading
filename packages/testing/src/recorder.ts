/**
 * A function that remembers how it was called and lets a test decide what it does. It is a plain
 * object with no test framework inside, so the same fake works under Vitest and Jest. A test
 * adapts it at its own edge (assert on `calls` with its own matchers).
 *
 * Behaviour is chosen in this order: the `*Once` queue first, then the last `implement`,
 * `returns`, `resolves` or `rejects`, then the fallback the recorder was created with. The
 * choosing methods return the recorder, so they chain: `rejectsOnce(error).resolves(value)`.
 */
export interface Recorder<Args extends unknown[], Result> {
  (...args: Args): Result;
  /** The arguments of every call so far, in order. */
  readonly calls: Args[];
  /** From now on, run this. */
  implement(fn: (...args: Args) => Result): Recorder<Args, Result>;
  /** Run this for the next call only. Several can be queued. */
  implementOnce(fn: (...args: Args) => Result): Recorder<Args, Result>;
  returns(value: Result): Recorder<Args, Result>;
  resolves(value: Awaited<Result>): Recorder<Args, Result>;
  resolvesOnce(value: Awaited<Result>): Recorder<Args, Result>;
  rejects(error: Error): Recorder<Args, Result>;
  rejectsOnce(error: Error): Recorder<Args, Result>;
  /** Forget the calls and every chosen behaviour; the fallback applies again. */
  reset(): void;
}

export function createRecorder<Args extends unknown[], Result>(
  fallback: (...args: Args) => Result,
): Recorder<Args, Result> {
  const calls: Args[] = [];
  const once: ((...args: Args) => Result)[] = [];
  let current = fallback;

  const resolving = (value: Awaited<Result>) => (): Result => Promise.resolve(value) as Result;
  const rejecting = (error: Error) => (): Result => Promise.reject(error) as Result;

  const recorder = (...args: Args): Result => {
    calls.push(args);
    const next = once.shift() ?? current;
    return next(...args);
  };

  const api: Recorder<Args, Result> = Object.assign(recorder, {
    calls,
    implement(fn: (...args: Args) => Result) {
      current = fn;
      return api;
    },
    implementOnce(fn: (...args: Args) => Result) {
      once.push(fn);
      return api;
    },
    returns(value: Result) {
      current = () => value;
      return api;
    },
    resolves(value: Awaited<Result>) {
      current = resolving(value);
      return api;
    },
    resolvesOnce(value: Awaited<Result>) {
      once.push(resolving(value));
      return api;
    },
    rejects(error: Error) {
      current = rejecting(error);
      return api;
    },
    rejectsOnce(error: Error) {
      once.push(rejecting(error));
      return api;
    },
    reset() {
      calls.length = 0;
      once.length = 0;
      current = fallback;
    },
  });
  return api;
}
