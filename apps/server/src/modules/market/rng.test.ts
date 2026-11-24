import { describe, expect, it } from 'vitest';

import { createRng, hashString, rngFor } from './rng.js';

const draws = (count: number, next: () => number) => Array.from({ length: count }, () => next());

describe('createRng', () => {
  it('RNG-01 gives the same sequence for the same seed', () => {
    const a = createRng(42);
    const b = createRng(42);
    expect(draws(100, () => a.next())).toEqual(draws(100, () => b.next()));
  });

  it('RNG-02 gives different sequences for different seeds', () => {
    const a = createRng(1);
    const b = createRng(2);
    expect(draws(10, () => a.next())).not.toEqual(draws(10, () => b.next()));
  });

  it('RNG-03 keeps next() in [0, 1)', () => {
    const rng = createRng(7);
    for (const value of draws(10_000, () => rng.next())) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  it('RNG-04 hashes a string seed', () => {
    const fromString = createRng('abc');
    const fromHash = createRng(hashString('abc'));
    expect(draws(20, () => fromString.next())).toEqual(draws(20, () => fromHash.next()));
  });

  it('RNG-07 normal() is standard normal', () => {
    const rng = createRng(11);
    const values = draws(20_000, () => rng.normal());
    const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
    const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
    expect(Math.abs(mean)).toBeLessThan(0.05);
    expect(Math.abs(Math.sqrt(variance) - 1)).toBeLessThan(0.05);
  });

  it('RNG-08 normal() is always finite', () => {
    const rng = createRng(13);
    for (const value of draws(20_000, () => rng.normal())) {
      expect(Number.isFinite(value)).toBe(true);
    }
  });

  it('RNG-09 exponential() has mean 1 / rate and is always positive', () => {
    const rng = createRng(17);
    const values = draws(20_000, () => rng.exponential(4));
    const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
    expect(Math.abs(mean - 0.25)).toBeLessThan(0.02);
    expect(values.every((value) => value > 0)).toBe(true);
  });

  it.each([0, -1, Number.NaN])('RNG-10 exponential() rejects the rate %s', (rate) => {
    expect(() => createRng(1).exponential(rate)).toThrow(RangeError);
  });
});

describe('hashString', () => {
  it('RNG-05 matches known FNV-1a values', () => {
    expect(hashString('')).toBe(2166136261);
    expect(hashString('a')).toBe(3826002220);
  });

  it('RNG-06 differs by input and is an unsigned 32-bit integer', () => {
    const hashes = ['AAPL', 'MSFT', 'AAPL:1', 'AAPL:2', 'x'].map(hashString);
    expect(new Set(hashes).size).toBe(hashes.length);
    for (const hash of hashes) {
      expect(Number.isInteger(hash)).toBe(true);
      expect(hash).toBeGreaterThanOrEqual(0);
      expect(hash).toBeLessThan(2 ** 32);
    }
  });
});

describe('rngFor', () => {
  it('RNG-11 is keyed by its parts', () => {
    const first = rngFor('AAPL', 5);
    const again = rngFor('AAPL', 5);
    const other = rngFor('AAPL', 6);
    const firstDraws = draws(10, () => first.next());
    expect(draws(10, () => again.next())).toEqual(firstDraws);
    expect(draws(10, () => other.next())).not.toEqual(firstDraws);
  });
});
