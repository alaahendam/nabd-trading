import { describe, expect, it } from 'vitest';

import { envSchema, validateEnv } from './env.js';

const issuePaths = (input: Record<string, unknown>) => {
  const result = envSchema.safeParse(input);
  return result.success ? [] : result.error.issues.map((issue) => issue.path.join('.'));
};

describe('envSchema', () => {
  it('ENV-01 applies defaults to an empty env', () => {
    expect(envSchema.parse({})).toEqual({
      NODE_ENV: 'development',
      PORT: 3000,
      CORS_ORIGIN: 'http://localhost:5173',
      MARKET_SEED: 'nabd',
      SIM_VOLATILITY_SCALE: 3,
      SIM_STEP_MS: 100,
      TICK_FLUSH_MS: 250,
    });
  });

  it('ENV-02 passes valid values through', () => {
    const input = {
      NODE_ENV: 'production',
      PORT: 8080,
      CORS_ORIGIN: 'https://nabd.example',
      MARKET_SEED: 'abc',
      SIM_VOLATILITY_SCALE: 2.5,
      SIM_STEP_MS: 250,
      TICK_FLUSH_MS: 500,
    };
    expect(envSchema.parse(input)).toEqual(input);
  });

  it('ENV-03 coerces a PORT string to a number', () => {
    expect(envSchema.parse({ PORT: '4000' }).PORT).toBe(4000);
  });

  it.each([
    ['ENV-04', { PORT: '0' }, 'PORT'],
    ['ENV-05', { PORT: '65536' }, 'PORT'],
    ['ENV-06', { PORT: '3000.5' }, 'PORT'],
    ['ENV-07', { PORT: 'abc' }, 'PORT'],
    ['ENV-08', { NODE_ENV: 'staging' }, 'NODE_ENV'],
    ['ENV-09', { CORS_ORIGIN: 'localhost' }, 'CORS_ORIGIN'],
  ])('%s rejects %j', (_id, input, path) => {
    expect(issuePaths(input)).toEqual([path]);
  });
});

describe('simulation env', () => {
  it('ENV-15 defaults the seed and accepts a string', () => {
    expect(envSchema.parse({}).MARKET_SEED).toBe('nabd');
    expect(envSchema.parse({ MARKET_SEED: 'abc' }).MARKET_SEED).toBe('abc');
  });

  it('ENV-16 requires a positive volatility scale', () => {
    expect(envSchema.parse({}).SIM_VOLATILITY_SCALE).toBe(3);
    expect(envSchema.parse({ SIM_VOLATILITY_SCALE: '2.5' }).SIM_VOLATILITY_SCALE).toBe(2.5);
    for (const bad of ['0', '-1', 'abc']) {
      expect(issuePaths({ SIM_VOLATILITY_SCALE: bad })).toEqual(['SIM_VOLATILITY_SCALE']);
    }
  });

  it('ENV-17 requires a step of 10 to 5000 ms', () => {
    expect(envSchema.parse({}).SIM_STEP_MS).toBe(100);
    expect(envSchema.parse({ SIM_STEP_MS: '250' }).SIM_STEP_MS).toBe(250);
    for (const bad of ['9', '5001', '1.5']) {
      expect(issuePaths({ SIM_STEP_MS: bad })).toEqual(['SIM_STEP_MS']);
    }
  });
});

describe('realtime env', () => {
  it('ENV-18 requires a flush interval of 10 to 5000 ms', () => {
    expect(envSchema.parse({}).TICK_FLUSH_MS).toBe(250);
    expect(envSchema.parse({ TICK_FLUSH_MS: '500' }).TICK_FLUSH_MS).toBe(500);
    for (const bad of ['9', '5001', '1.5']) {
      expect(issuePaths({ TICK_FLUSH_MS: bad })).toEqual(['TICK_FLUSH_MS']);
    }
  });
});

describe('validateEnv', () => {
  it('ENV-10 throws a readable error naming the invalid field', () => {
    expect(() => validateEnv({ PORT: 'abc' })).toThrow(/Invalid environment.*PORT/s);
  });

  it('ENV-14 returns the parsed env when valid', () => {
    expect(validateEnv({ PORT: '5000' }).PORT).toBe(5000);
  });
});
