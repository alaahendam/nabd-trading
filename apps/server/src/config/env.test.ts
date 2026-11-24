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
    });
  });

  it('ENV-02 passes valid values through', () => {
    const input = { NODE_ENV: 'production', PORT: 8080, CORS_ORIGIN: 'https://nabd.example' };
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

describe('validateEnv', () => {
  it('ENV-10 throws a readable error naming the invalid field', () => {
    expect(() => validateEnv({ PORT: 'abc' })).toThrow(/Invalid environment.*PORT/s);
  });

  it('ENV-14 returns the parsed env when valid', () => {
    expect(validateEnv({ PORT: '5000' }).PORT).toBe(5000);
  });
});
