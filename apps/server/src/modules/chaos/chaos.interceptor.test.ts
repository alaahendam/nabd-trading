import type { CallHandler, ExecutionContext } from '@nestjs/common';
import { firstValueFrom, lastValueFrom, type Observable, of } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiException } from '../../common/api-exception.js';
import { ChaosInterceptor } from './chaos.interceptor.js';

const contextFor = (type: string, path = '/api/stocks') =>
  ({
    getType: () => type,
    switchToHttp: () => ({ getRequest: () => ({ path }) }),
  }) as unknown as ExecutionContext;

const handlerReturning = (value: unknown) => {
  const handle = vi.fn(() => of(value));
  return { handler: { handle } as CallHandler, handle };
};

const make = (options: { latencyMs: number; errorRate: number }, random = () => 0.5) => {
  const spy = vi.fn(random);
  return { interceptor: new ChaosInterceptor(options, spy), random: spy };
};

type Outcome = { value: unknown } | { error: unknown };

/**
 * Starts listening at once, so a failure that happens while fake timers advance is already
 * handled, then lets the timers run and reports how the request ended.
 */
const outcomeAfter = async (source: Observable<unknown>, ms = 0): Promise<Outcome> => {
  const ended = lastValueFrom(source).then(
    (value): Outcome => ({ value }),
    (error: unknown): Outcome => ({ error }),
  );
  await vi.advanceTimersByTimeAsync(ms);
  return ended;
};

describe('ChaosInterceptor', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('CHS-01 does nothing when both flags are off', async () => {
    const { interceptor, random } = make({ latencyMs: 0, errorRate: 0 });
    const { handler } = handlerReturning('ok');
    const result = await firstValueFrom(interceptor.intercept(contextFor('http'), handler));
    expect(result).toBe('ok');
    expect(random).not.toHaveBeenCalled();
  });

  it('CHS-02 delays the response by the latency', async () => {
    const { interceptor } = make({ latencyMs: 500, errorRate: 0 });
    const { handler } = handlerReturning('ok');
    const received: unknown[] = [];
    interceptor.intercept(contextFor('http'), handler).subscribe((value) => received.push(value));

    await vi.advanceTimersByTimeAsync(499);
    expect(received).toEqual([]);
    await vi.advanceTimersByTimeAsync(1);
    expect(received).toEqual(['ok']);
  });

  it('CHS-03 fails the share of requests the rate asks for, before the handler runs', async () => {
    const failing = make({ latencyMs: 0, errorRate: 0.3 }, () => 0.1);
    const first = handlerReturning('ok');
    const failure = await outcomeAfter(
      failing.interceptor.intercept(contextFor('http'), first.handler),
    );
    expect(failure).toMatchObject({ error: expect.any(ApiException) as ApiException });
    expect((failure as { error: ApiException }).error.getStatus()).toBe(503);
    expect(first.handle).not.toHaveBeenCalled();

    const passing = make({ latencyMs: 0, errorRate: 0.3 }, () => 0.9);
    const second = handlerReturning('ok');
    const success = await outcomeAfter(
      passing.interceptor.intercept(contextFor('http'), second.handler),
    );
    expect(success).toEqual({ value: 'ok' });
    expect(second.handle).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['rate 1 with random 0.999 fails', 1, 0.999, false],
    ['rate 0.3 with random 0.3 passes', 0.3, 0.3, true],
  ])('CHS-04 %s', async (_label, errorRate, randomValue, passes) => {
    const { interceptor } = make({ latencyMs: 0, errorRate }, () => randomValue);
    const { handler } = handlerReturning('ok');
    const outcome = await outcomeAfter(interceptor.intercept(contextFor('http'), handler));
    expect('value' in outcome).toBe(passes);
  });

  it('CHS-05 never touches the health endpoint', async () => {
    const { interceptor, random } = make({ latencyMs: 500, errorRate: 1 });
    const { handler } = handlerReturning('ok');
    const result = await firstValueFrom(
      interceptor.intercept(contextFor('http', '/api/health'), handler),
    );
    expect(result).toBe('ok');
    expect(random).not.toHaveBeenCalled();
  });

  it('CHS-06 leaves non-HTTP contexts alone', async () => {
    const { interceptor, random } = make({ latencyMs: 500, errorRate: 1 });
    const { handler } = handlerReturning('ok');
    const result = await firstValueFrom(interceptor.intercept(contextFor('ws'), handler));
    expect(result).toBe('ok');
    expect(random).not.toHaveBeenCalled();
  });

  it('CHS-07 makes a failure wait for the latency too', async () => {
    const { interceptor } = make({ latencyMs: 200, errorRate: 1 }, () => 0);
    const { handler } = handlerReturning('ok');
    let failed = false;
    interceptor.intercept(contextFor('http'), handler).subscribe({
      error: () => {
        failed = true;
      },
    });

    await vi.advanceTimersByTimeAsync(199);
    expect(failed).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    expect(failed).toBe(true);
  });
});
