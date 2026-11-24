import { API_PREFIX, ROUTES } from '@nabd/shared';
import {
  type CallHandler,
  type ExecutionContext,
  Inject,
  Injectable,
  type NestInterceptor,
} from '@nestjs/common';
import { mergeMap, type Observable, throwError, timer } from 'rxjs';

import { ApiException } from '../../common/api-exception.js';
import { CHAOS_OPTIONS, type ChaosOptions, RANDOM } from './chaos.options.js';

const HEALTH_PATH = `${API_PREFIX}${ROUTES.health}`;

/**
 * Adds latency and random 503s to HTTP requests, to exercise the client's loading, error and
 * retry states. Off by default. Never touches the health endpoint or non-HTTP traffic.
 */
@Injectable()
export class ChaosInterceptor implements NestInterceptor {
  constructor(
    @Inject(CHAOS_OPTIONS) private readonly options: ChaosOptions,
    @Inject(RANDOM) private readonly random: () => number,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const { latencyMs, errorRate } = this.options;
    const enabled = latencyMs > 0 || errorRate > 0;
    if (!enabled || context.getType() !== 'http') {
      return next.handle();
    }
    if (context.switchToHttp().getRequest<{ path: string }>().path === HEALTH_PATH) {
      return next.handle();
    }

    const fails = this.random() < errorRate;
    return timer(latencyMs).pipe(
      mergeMap(() =>
        fails
          ? throwError(
              () => new ApiException('SERVICE_UNAVAILABLE', 'Simulated failure (chaos mode)'),
            )
          : next.handle(),
      ),
    );
  }
}
