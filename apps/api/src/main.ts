import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

// Phase 3 adds: env validation, helmet, cookies, validation pipe, throttling,
// exception filter, Swagger (dev only). This file is a compile-checked skeleton.
async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  await app.listen(process.env.PORT ?? 3001);
}

void bootstrap();
