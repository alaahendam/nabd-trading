import { z } from 'zod';

import { dataEnvelope } from './market.js';

export const healthResponseSchema = dataEnvelope(
  z.object({
    status: z.literal('ok'),
    uptimeSeconds: z.number().nonnegative(),
  }),
);
export type HealthResponse = z.infer<typeof healthResponseSchema>;
