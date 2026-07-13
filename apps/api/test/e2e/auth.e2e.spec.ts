import request from 'supertest';
import * as argon2 from 'argon2';
import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createTestApp, TestAppContext } from '../support/build-test-app';
import { makeUser } from '../support/fixtures';

function extractSessionCookie(response: request.Response): string {
  const setCookie = response.headers['set-cookie'];
  const raw = Array.isArray(setCookie) ? setCookie[0] : setCookie;
  if (!raw) {
    throw new Error('Expected a Set-Cookie header but got none.');
  }
  return raw.split(';')[0];
}

/**
 * Registration/login are throttled to 10 req/min per `AuthModule`'s
 * `ThrottlerModule.forRoot` (hardcoded, not env-driven — unlike the AI
 * module's throttler, this one can't be relaxed via test env vars without
 * touching `auth.module.ts`, which this workstream doesn't own). Seeding
 * users directly into the fake repo — and minting cookies straight from
 * `JwtService` — keeps setup-only work off that shared budget so the actual
 * assertions below never risk a spurious 429.
 */
async function seedLoggableUser(app: INestApplication, ctx: TestAppContext, overrides: { email: string; password: string }) {
  const passwordHash = await argon2.hash(overrides.password);
  const user = makeUser({ email: overrides.email, passwordHash });
  ctx.usersRepo.seed(user);
  return user;
}

function mintSessionCookie(app: INestApplication, userId: string): string {
  const jwtService = app.get(JwtService);
  const token = jwtService.sign({ sub: userId });
  return `eai_session=${token}`;
}

describe('Auth (e2e)', () => {
  let ctx: TestAppContext;
  let app: INestApplication;

  beforeAll(async () => {
    ctx = await createTestApp();
    app = ctx.app;
  });

  afterEach(() => {
    ctx.usersRepo.clear();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/auth/register', () => {
    it('returns 201 and sets an HttpOnly eai_session cookie', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ name: 'Jane Doe', email: 'jane@example.com', password: 'correct-horse-battery' });

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({ name: 'Jane Doe', email: 'jane@example.com' });
      expect(response.body).not.toHaveProperty('passwordHash');

      const setCookie = response.headers['set-cookie'];
      const raw = Array.isArray(setCookie) ? setCookie[0] : setCookie;
      expect(raw).toContain('eai_session=');
      expect(raw).toContain('HttpOnly');
    });

    it('returns 400 for an invalid email', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ name: 'Jane Doe', email: 'not-an-email', password: 'correct-horse-battery' });

      expect(response.status).toBe(400);
    });

    it('returns 400 for a too-short password', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ name: 'Jane Doe', email: 'jane2@example.com', password: 'short' });

      expect(response.status).toBe(400);
    });

    it('returns 409 with a generic message for a duplicate email', async () => {
      await seedLoggableUser(app, ctx, { email: 'dupe@example.com', password: 'correct-horse-battery' });

      const response = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ name: 'Jane Doe', email: 'dupe@example.com', password: 'another-password' });

      expect(response.status).toBe(409);
      expect(response.body.message).toBe('Unable to register with these details.');
    });
  });

  describe('POST /api/auth/login', () => {
    it('returns 200 and a session cookie for correct credentials', async () => {
      await seedLoggableUser(app, ctx, { email: 'login-user@example.com', password: 'correct-horse-battery' });

      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'login-user@example.com', password: 'correct-horse-battery' });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({ email: 'login-user@example.com' });
      expect(extractSessionCookie(response)).toContain('eai_session=');
    });

    it('returns an identical 401 body for a wrong password and an unknown email (no enumeration)', async () => {
      await seedLoggableUser(app, ctx, { email: 'login-user-2@example.com', password: 'correct-horse-battery' });

      const wrongPassword = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'login-user-2@example.com', password: 'totally-wrong' });
      const unknownEmail = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'nobody@example.com', password: 'totally-wrong' });

      expect(wrongPassword.status).toBe(401);
      expect(unknownEmail.status).toBe(401);
      expect(wrongPassword.body.message).toBe('Invalid email or password.');
      expect(unknownEmail.body.message).toBe('Invalid email or password.');
    });
  });

  describe('GET /api/auth/me', () => {
    it('returns 200 with the user (sans passwordHash) when a valid session cookie is sent', async () => {
      const user = await seedLoggableUser(app, ctx, { email: 'me-user@example.com', password: 'correct-horse-battery' });
      const cookie = mintSessionCookie(app, user.id);

      const response = await request(app.getHttpServer()).get('/api/auth/me').set('Cookie', cookie);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({ name: user.name, email: 'me-user@example.com' });
      expect(response.body).not.toHaveProperty('passwordHash');
    });

    it('returns 401 when no cookie is sent', async () => {
      const response = await request(app.getHttpServer()).get('/api/auth/me');

      expect(response.status).toBe(401);
    });
  });

  describe('error body shape', () => {
    it('every error response has {statusCode, message, requestId} and never a stack', async () => {
      const response = await request(app.getHttpServer()).get('/api/auth/me');

      expect(response.status).toBe(401);
      expect(response.body).toEqual(
        expect.objectContaining({
          statusCode: 401,
          message: expect.any(String),
          requestId: expect.any(String),
        }),
      );
      expect(response.body).not.toHaveProperty('stack');
    });
  });
});
