import { type HealthResponse, ROUTES } from '@nabd/shared';
import { Controller, Get } from '@nestjs/common';

@Controller()
export class HealthController {
  @Get(ROUTES.health)
  check(): HealthResponse {
    return { data: { status: 'ok', uptimeSeconds: process.uptime() } };
  }
}
