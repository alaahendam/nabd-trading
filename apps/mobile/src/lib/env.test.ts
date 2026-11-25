import { readEnv } from './env';

const url = (value: string | undefined) => readEnv({ EXPO_PUBLIC_API_URL: value });

describe('readEnv', () => {
  it('ENV-01 accepts an https address', () => {
    expect(url('https://api.example.com')).toEqual({
      ok: true,
      env: { apiUrl: 'https://api.example.com' },
    });
  });

  it.each(['http://10.0.2.2:3000', 'http://192.168.1.20:3000'])(
    'ENV-02 accepts the local http address %s',
    (value) => {
      expect(url(value)).toEqual({ ok: true, env: { apiUrl: value } });
    },
  );

  it('ENV-03 removes trailing slashes', () => {
    expect(url('https://api.example.com//')).toEqual({
      ok: true,
      env: { apiUrl: 'https://api.example.com' },
    });
  });

  it.each([undefined, '', '   '])('ENV-04 reports %j as missing', (value) => {
    expect(url(value)).toEqual({
      ok: false,
      problems: [{ name: 'EXPO_PUBLIC_API_URL', kind: 'missing' }],
    });
  });

  it.each(['api.example.com', 'not a url', 'ftp://api.example.com', 'ws://api.example.com'])(
    'ENV-05/06 reports %j as invalid',
    (value) => {
      expect(url(value)).toEqual({
        ok: false,
        problems: [{ name: 'EXPO_PUBLIC_API_URL', kind: 'invalid' }],
      });
    },
  );

  it('ENV-07 trims surrounding spaces', () => {
    expect(url('  https://api.example.com  ')).toEqual({
      ok: true,
      env: { apiUrl: 'https://api.example.com' },
    });
  });
});
