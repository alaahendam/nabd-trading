import { describe, expect, it } from 'vitest';

import { healthResponseSchema } from './health.js';
import { ROUTES } from './routes.js';

describe('health', () => {
  it('HLT-01 parses an ok response wrapped in { data }', () => {
    const body = { data: { status: 'ok', uptimeSeconds: 12.5 } };
    expect(healthResponseSchema.parse(body)).toEqual(body);
  });

  it.each([
    ['another status', { data: { status: 'degraded', uptimeSeconds: 1 } }],
    ['negative uptime', { data: { status: 'ok', uptimeSeconds: -1 } }],
    ['no data wrapper', { status: 'ok', uptimeSeconds: 1 }],
  ])('HLT-02 rejects %s', (_label, body) => {
    expect(healthResponseSchema.safeParse(body).success).toBe(false);
  });

  it('HLT-03 has a route', () => {
    expect(ROUTES.health).toBe('/health');
  });
});
