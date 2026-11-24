import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module.js';
import { configureApp } from './app.setup.js';
import type { Env } from './config/env.js';

const app = await NestFactory.create(AppModule);
const config = app.get<ConfigService<Env, true>>(ConfigService);

configureApp(app);
app.enableCors({ origin: config.get('CORS_ORIGIN', { infer: true }) });
await app.listen(config.get('PORT', { infer: true }));
