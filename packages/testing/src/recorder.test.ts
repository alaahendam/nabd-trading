import { describe, expect, it } from 'vitest';

import { createRecorder } from './recorder.js';

const add = createRecorder<[a: number, b: number], number>((a, b) => a + b);

describe('createRecorder', () => {
  it('REC-01 records every call', () => {
    const recorder = createRecorder<[number, string], string>(() => 'x');
    recorder(1, 'a');
    recorder(2, 'b');
    expect(recorder.calls).toEqual([
      [1, 'a'],
      [2, 'b'],
    ]);
  });

  it('REC-02 runs the fallback until a test chooses', () => {
    const recorder = createRecorder<[number, number], number>((a, b) => a + b);
    expect(recorder(2, 3)).toBe(5);
  });

  it('REC-03 implement replaces the behavior', () => {
    const recorder = createRecorder<[number, number], number>((a, b) => a + b);
    recorder.implement((a, b) => a * b);
    expect([recorder(2, 3), recorder(4, 5)]).toEqual([6, 20]);
  });

  it('REC-04 implementOnce answers one call', () => {
    const recorder = createRecorder<[number, number], number>((a, b) => a + b);
    recorder.implementOnce(() => 99);
    expect([recorder(1, 1), recorder(1, 1)]).toEqual([99, 2]);
  });

  it('REC-05 returns gives a fixed value', () => {
    const recorder = createRecorder<[], number>(() => 0);
    recorder.returns(42);
    expect([recorder(), recorder()]).toEqual([42, 42]);
  });

  it('REC-06 resolves and resolvesOnce', async () => {
    const recorder = createRecorder<[], Promise<string>>(() => Promise.resolve('fallback'));
    recorder.resolves('x');
    recorder.resolvesOnce('y');
    expect(await recorder()).toBe('y');
    expect(await recorder()).toBe('x');
  });

  it('REC-07 rejects and rejectsOnce', async () => {
    const recorder = createRecorder<[], Promise<string>>(() => Promise.resolve('fallback'));
    recorder.rejects(new Error('always'));
    recorder.rejectsOnce(new Error('first'));
    await expect(recorder()).rejects.toThrow('first');
    await expect(recorder()).rejects.toThrow('always');
  });

  it('REC-08 once answers queue in order, then the default', () => {
    const recorder = createRecorder<[], string>(() => 'default');
    recorder.implementOnce(() => 'one');
    recorder.implementOnce(() => 'two');
    recorder.implementOnce(() => 'three');
    expect([recorder(), recorder(), recorder(), recorder()]).toEqual([
      'one',
      'two',
      'three',
      'default',
    ]);
  });

  it('REC-09 a once answer wins over the chosen default', async () => {
    const recorder = createRecorder<[], Promise<string>>(() => Promise.resolve('fallback'));
    recorder.resolves('d');
    recorder.resolvesOnce('o');
    expect([await recorder(), await recorder()]).toEqual(['o', 'd']);
  });

  it('REC-10 reset forgets calls, choices and queued answers', () => {
    const recorder = createRecorder<[number, number], number>((a, b) => a + b);
    recorder.implement(() => 1);
    recorder.implementOnce(() => 2);
    recorder(1, 1);
    recorder.reset();
    expect(recorder.calls).toEqual([]);
    expect(recorder(5, 6)).toBe(11);
  });

  it('REC-11 keeps the arguments as they were passed', () => {
    const recorder = createRecorder<[{ id: number }], undefined>(() => undefined);
    const argument = { id: 1 };
    recorder(argument);
    expect(recorder.calls[0]?.[0]).toBe(argument);
  });

  it('REC-12 the choosing methods return the recorder, so they chain', async () => {
    const recorder = createRecorder<[], Promise<string>>(() => Promise.resolve('fallback'));
    expect(recorder.rejectsOnce(new Error('first')).resolves('then')).toBe(recorder);
    await expect(recorder()).rejects.toThrow('first');
    expect(await recorder()).toBe('then');

    const returned = [
      recorder.implement(() => Promise.resolve('a')),
      recorder.implementOnce(() => Promise.resolve('b')),
      recorder.returns(Promise.resolve('c')),
      recorder.resolvesOnce('d'),
      recorder.rejects(new Error('e')),
    ];
    for (const result of returned) {
      expect(result).toBe(recorder);
    }
  });

  it('is an ordinary function with no test framework behind it', () => {
    expect(typeof add).toBe('function');
    expect(add(1, 2)).toBe(3);
  });
});
