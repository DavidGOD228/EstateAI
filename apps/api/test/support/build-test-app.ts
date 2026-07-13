import { json, urlencoded } from 'express';
import type { NextFunction, Request, Response } from 'express';
import cookieParser from 'cookie-parser';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { AppModule } from '../../src/app.module';
import { AllExceptionsFilter } from '../../src/common/all-exceptions.filter';
import { LoggingInterceptor } from '../../src/common/logging.interceptor';
import { RequestIdMiddleware } from '../../src/common/request-id.middleware';
import { User } from '../../src/users/user.entity';
import { Property } from '../../src/properties/property.entity';
import { PropertiesService } from '../../src/properties/properties.service';
import { AI_PROVIDER } from '../../src/ai/ai-provider.interface';
import { FakeUserRepository } from './fake-user-repository';
import { FakePropertiesService } from './fake-properties-service';
import { FakeAiProvider, makeFakeAiProvider } from './fake-ai-provider';

export interface TestAppContext {
  app: INestApplication;
  usersRepo: FakeUserRepository;
  propertiesService: FakePropertiesService;
  aiProvider: FakeAiProvider;
}

/**
 * Builds the real `AppModule` with only the boundaries the assignment calls
 * out swapped for hermetic fakes:
 *   - `getRepositoryToken(User)` -> in-memory repo (AuthService's only dep)
 *   - `PropertiesService` -> in-memory fake (AI module's only external dep)
 *   - `getRepositoryToken(Property)` -> unused stub (PropertiesService is
 *     itself overridden above, but the token still exists on the DI graph
 *     via `TypeOrmModule.forFeature`, so it must resolve to *something*)
 *   - `DataSource` -> stub `query()` for `HealthController`
 *   - `AI_PROVIDER` -> jest mock
 *
 * Everything else (guards, pipes, filters, controllers, real prompts/schema
 * validation) is the genuine production wiring, mirroring `src/main.ts`'s
 * bootstrap exactly (global prefix, cookie-parser, body limits, request-id
 * middleware, ValidationPipe, exception filter, logging interceptor) since
 * that setup normally only happens in `main.ts` and is never applied by
 * `Test.createTestingModule` automatically.
 */
export async function createTestApp(): Promise<TestAppContext> {
  const usersRepo = new FakeUserRepository();
  const propertiesService = new FakePropertiesService();
  const aiProvider = makeFakeAiProvider();

  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(getRepositoryToken(User))
    .useValue(usersRepo)
    .overrideProvider(getRepositoryToken(Property))
    .useValue({})
    .overrideProvider(PropertiesService)
    .useValue(propertiesService)
    .overrideProvider(DataSource)
    .useValue({ query: async () => [{ ok: 1 }] })
    .overrideProvider(AI_PROVIDER)
    .useValue(aiProvider)
    .compile();

  const app = moduleRef.createNestApplication<NestExpressApplication>({
    bodyParser: false,
    logger: false,
  });

  app.use(cookieParser(process.env.COOKIE_SECRET));
  app.use(json({ limit: '100kb' }));
  app.use(urlencoded({ extended: true, limit: '100kb' }));

  const requestIdMiddleware = new RequestIdMiddleware();
  app.use((req: Request, res: Response, next: NextFunction) => requestIdMiddleware.use(req, res, next));

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());

  await app.init();

  return { app, usersRepo, propertiesService, aiProvider };
}
