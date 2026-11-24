import { describe, expect, it } from 'vitest';

import { env, envSchema, parseEnv } from './env';

describe('envSchema', () => {
  it('WEB-01 applies defaults to an empty env', () => {
    expect(envSchema.parse({})).toEqual({ VITE_API_URL: 'http://localhost:3000' });
  });

  it('WEB-02 passes a valid URL through', () => {
    const input = { VITE_API_URL: 'https://api.nabd.example' };
    expect(envSchema.parse(input)).toEqual(input);
  });

  it('WEB-03 ignores unknown variables', () => {
    expect(envSchema.parse({ MODE: 'test', VITE_X: '1' })).toEqual({
      VITE_API_URL: 'http://localhost:3000',
    });
  });
});

describe('parseEnv', () => {
  it('WEB-04 throws a readable error naming the invalid field', () => {
    expect(() => parseEnv({ VITE_API_URL: 'not-a-url' })).toThrow(
      /Invalid environment.*VITE_API_URL/s,
    );
  });

  it('WEB-05 returns the parsed env when valid', () => {
    expect(parseEnv({ VITE_API_URL: 'http://x.test' })).toEqual({ VITE_API_URL: 'http://x.test' });
  });
});

describe('env', () => {
  it('WEB-06 is parsed from import.meta.env', () => {
    expect(env.VITE_API_URL).toBe('http://localhost:3000');
  });
});
