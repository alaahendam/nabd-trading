import { API_PREFIX } from '@nabd/shared';
import type { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';

import { ApiException } from './common/api-exception.js';
import { CorsIoAdapter } from './common/cors-io.adapter.js';
import { toErrorResponse } from './common/error-response.js';
import type { Env } from './config/env.js';

interface RequestLike {
  path: string;
}

interface ResponseLike {
  status(code: number): { json(body: unknown): void };
}

const isApiPath = (path: string) => path === API_PREFIX || path.startsWith(`${API_PREFIX}/`);

/** HTTP setup shared by `main.ts` and the tests, so tests run the real thing. */
export function configureApp(app: INestApplication): void {
  const origin = app.get<ConfigService<Env, true>>(ConfigService).get('CORS_ORIGIN', {
    infer: true,
  });

  app.use(helmet());
  app.enableCors({ origin });
  // Nest only routes under the prefix; without this, Express answers other paths with
  // its own HTML 404 instead of the shared error shape.
  app.use((request: RequestLike, response: ResponseLike, next: () => void) => {
    if (isApiPath(request.path)) {
      next();
      return;
    }
    const { status, body } = toErrorResponse(new ApiException('NOT_FOUND', 'Resource not found'));
    response.status(status).json(body);
  });
  app.setGlobalPrefix(API_PREFIX);
  app.useWebSocketAdapter(new CorsIoAdapter(app, origin));
}
