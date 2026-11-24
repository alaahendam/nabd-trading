export interface Rng {
  /** Uniform in [0, 1). */
  next(): number;
  /** Standard normal (mean 0, standard deviation 1). */
  normal(): number;
  /** Exponential with the given rate (mean `1 / rate`). */
  exponential(rate: number): number;
}

/** FNV-1a, 32 bit. Stable across runs and platforms, so names make reproducible seeds. */
export function hashString(text: string): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** mulberry32: a small, fast, seedable generator. Not for cryptography. */
function mulberry32(seed: number): () => number {
  let state = seed | 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createRng(seed: number | string): Rng {
  const next = mulberry32(typeof seed === 'string' ? hashString(seed) : seed);
  return {
    next,
    normal() {
      // 1 - next() is in (0, 1], so the logarithm is always finite.
      const radius = Math.sqrt(-2 * Math.log(1 - next()));
      return radius * Math.cos(2 * Math.PI * next());
    },
    exponential(rate) {
      if (!(rate > 0)) {
        throw new RangeError(`Exponential rate must be positive, got ${rate}`);
      }
      return -Math.log(1 - next()) / rate;
    },
  };
}

/** A generator keyed by its parts, so a value can be a pure function of (symbol, index, ...). */
export function rngFor(...parts: readonly (string | number)[]): Rng {
  return createRng(hashString(parts.join(':')));
}
