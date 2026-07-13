import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { CreatePropertyDto } from '../../src/properties/dto/create-property.dto';
import { createTestApp, TestAppContext } from '../support/build-test-app';
import { seedAuthenticatedUser } from '../support/auth-helpers';
import { makeProperty } from '../support/fixtures';

const validCreateBody: CreatePropertyDto = {
  title: 'Bright two-bedroom flat',
  description: 'A bright, recently renovated flat close to the park.',
  price: 245000,
  address: 'Weizenbergi 12',
  city: 'Tallinn',
  country: 'Estonia',
  bedrooms: 2,
  bathrooms: 1,
  areaSqm: 68,
  propertyType: 'apartment',
  features: ['Balcony', 'Parking'],
};

describe('Properties (e2e)', () => {
  let ctx: TestAppContext;
  let app: INestApplication;

  beforeAll(async () => {
    ctx = await createTestApp();
    app = ctx.app;
  });

  afterEach(() => {
    ctx.propertiesService.clear();
    ctx.usersRepo.clear();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/properties', () => {
    it('returns 200 with items and total from the fake service', async () => {
      const properties = [
        makeProperty({ city: 'Tallinn', propertyType: 'apartment' }),
        makeProperty({ city: 'Tartu', propertyType: 'house' }),
      ];
      ctx.propertiesService.seed(properties);

      const response = await request(app.getHttpServer()).get('/api/properties');

      expect(response.status).toBe(200);
      expect(response.body.total).toBe(2);
      expect(response.body.items).toHaveLength(2);
      expect(response.body.items[0]).not.toHaveProperty('externalRef');
    });

    it('applies query filters (propertyType, minBedrooms, maxPrice, location)', async () => {
      ctx.propertiesService.seed([
        makeProperty({ city: 'Tallinn', propertyType: 'apartment', bedrooms: 3, price: 200000 }),
        makeProperty({ city: 'Tartu', propertyType: 'house', bedrooms: 1, price: 500000 }),
      ]);

      const response = await request(app.getHttpServer()).get('/api/properties').query({
        propertyType: 'apartment',
        minBedrooms: 2,
        maxPrice: 300000,
        location: 'tall',
      });

      expect(response.status).toBe(200);
      expect(response.body.total).toBe(1);
      expect(response.body.items[0].city).toBe('Tallinn');
    });

    it('returns 400 for an invalid propertyType', async () => {
      const response = await request(app.getHttpServer()).get('/api/properties').query({ propertyType: 'castle' });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/properties/:id', () => {
    it('returns 400 for a non-UUID id', async () => {
      const response = await request(app.getHttpServer()).get('/api/properties/not-a-uuid');

      expect(response.status).toBe(400);
    });

    it('returns 404 for an unknown (but valid) UUID', async () => {
      const response = await request(app.getHttpServer()).get('/api/properties/00000000-0000-4000-8000-000000000000');

      expect(response.status).toBe(404);
    });

    it('returns 200 with the property when found', async () => {
      const property = makeProperty();
      ctx.propertiesService.seed([property]);

      const response = await request(app.getHttpServer()).get(`/api/properties/${property.id}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(property.id);
      expect(response.body).not.toHaveProperty('externalRef');
    });
  });

  describe('POST /api/properties', () => {
    it('returns 401 when no session cookie is sent', async () => {
      const response = await request(app.getHttpServer()).post('/api/properties').send(validCreateBody);

      expect(response.status).toBe(401);
    });

    it.each([
      ['missing title', (() => { const { title: _title, ...rest } = validCreateBody; return rest; })()],
      ['non-positive price', { ...validCreateBody, price: 0 }],
      ['11 features', { ...validCreateBody, features: Array.from({ length: 11 }, (_, i) => `feature-${i}`) }],
      ['profane title', { ...validCreateBody, title: 'Shitty flat with a view' }],
      ['profane description', { ...validCreateBody, description: 'No fucking parking though.' }],
      ['profane feature tag', { ...validCreateBody, features: ['Balcony', 'dumbass neighbors'] }],
    ])('returns 400 for an invalid body (%s)', async (_label, body) => {
      const { cookie } = await seedAuthenticatedUser(ctx);

      const response = await request(app.getHttpServer()).post('/api/properties').set('Cookie', cookie).send(body);

      expect(response.status).toBe(400);
    });

    it('returns 201 with the created property, isOwn: true, and no ownerId/externalRef leak', async () => {
      const { user, cookie } = await seedAuthenticatedUser(ctx);

      const response = await request(app.getHttpServer()).post('/api/properties').set('Cookie', cookie).send(validCreateBody);

      expect(response.status).toBe(201);
      expect(response.body.isOwn).toBe(true);
      expect(response.body.title).toBe(validCreateBody.title);
      expect(response.body).not.toHaveProperty('externalRef');
      expect(response.body).not.toHaveProperty('ownerId');
      expect(user.id).toBeTruthy();
    });
  });

  describe('isOwn on GET /api/properties and GET /api/properties/:id', () => {
    it('GET /api/properties shows isOwn true on the owner\'s own item and falsy on seeded ones, for the owner', async () => {
      const { user, cookie } = await seedAuthenticatedUser(ctx, { email: 'owner@example.com' });
      const seeded = makeProperty({ ownerId: null });
      const ownItem = await ctx.propertiesService.create(validCreateBody, user.id);
      ctx.propertiesService.seed([seeded, ownItem]);

      const response = await request(app.getHttpServer()).get('/api/properties').set('Cookie', cookie);

      expect(response.status).toBe(200);
      const own = response.body.items.find((item: { id: string }) => item.id === ownItem.id);
      const other = response.body.items.find((item: { id: string }) => item.id === seeded.id);
      expect(own.isOwn).toBe(true);
      expect(other.isOwn).toBeFalsy();
      expect(response.body.items.every((item: Record<string, unknown>) => !('ownerId' in item))).toBe(true);
    });

    it('GET as another authenticated user shows falsy isOwn and never an ownerId key', async () => {
      const { user: owner } = await seedAuthenticatedUser(ctx, { email: 'owner2@example.com' });
      const { cookie: otherCookie } = await seedAuthenticatedUser(ctx, { email: 'other@example.com' });
      const ownItem = await ctx.propertiesService.create(validCreateBody, owner.id);
      ctx.propertiesService.seed([ownItem]);

      const response = await request(app.getHttpServer()).get(`/api/properties/${ownItem.id}`).set('Cookie', otherCookie);

      expect(response.status).toBe(200);
      expect(response.body.isOwn).toBeFalsy();
      expect(response.body).not.toHaveProperty('ownerId');
    });

    it('GET with a garbage/invalid session cookie still returns 200 (OptionalJwtAuthGuard never throws)', async () => {
      const property = makeProperty();
      ctx.propertiesService.seed([property]);

      const response = await request(app.getHttpServer()).get('/api/properties').set('Cookie', 'eai_session=not-a-real-jwt');

      expect(response.status).toBe(200);
      expect(response.body.items[0].isOwn).toBeFalsy();
    });

    it('GET unauthenticated shows falsy isOwn and never an ownerId key', async () => {
      const { user: owner } = await seedAuthenticatedUser(ctx, { email: 'owner3@example.com' });
      const ownItem = await ctx.propertiesService.create(validCreateBody, owner.id);
      ctx.propertiesService.seed([ownItem]);

      const listResponse = await request(app.getHttpServer()).get('/api/properties');
      const detailResponse = await request(app.getHttpServer()).get(`/api/properties/${ownItem.id}`);

      expect(listResponse.body.items[0].isOwn).toBeFalsy();
      expect(listResponse.body.items[0]).not.toHaveProperty('ownerId');
      expect(detailResponse.body.isOwn).toBeFalsy();
      expect(detailResponse.body).not.toHaveProperty('ownerId');
    });
  });

  describe('PATCH /api/properties/:id', () => {
    it('returns 401 when no session cookie is sent', async () => {
      const property = makeProperty();
      ctx.propertiesService.seed([property]);

      const response = await request(app.getHttpServer())
        .patch(`/api/properties/${property.id}`)
        .send({ title: 'New title' });

      expect(response.status).toBe(401);
    });

    it('returns 403 when the authenticated user does not own the listing', async () => {
      const { cookie } = await seedAuthenticatedUser(ctx);
      const property = makeProperty({ ownerId: null });
      ctx.propertiesService.seed([property]);

      const response = await request(app.getHttpServer())
        .patch(`/api/properties/${property.id}`)
        .set('Cookie', cookie)
        .send({ title: 'New title' });

      expect(response.status).toBe(403);
    });

    it('returns 403 for another authenticated user who owns a different listing', async () => {
      const { user: owner } = await seedAuthenticatedUser(ctx, { email: 'owner4@example.com' });
      const { cookie: otherCookie } = await seedAuthenticatedUser(ctx, { email: 'other4@example.com' });
      const ownItem = await ctx.propertiesService.create(validCreateBody, owner.id);
      ctx.propertiesService.seed([ownItem]);

      const response = await request(app.getHttpServer())
        .patch(`/api/properties/${ownItem.id}`)
        .set('Cookie', otherCookie)
        .send({ title: 'New title' });

      expect(response.status).toBe(403);
    });

    it('returns 404 for an unknown (but valid) UUID', async () => {
      const { cookie } = await seedAuthenticatedUser(ctx);

      const response = await request(app.getHttpServer())
        .patch('/api/properties/00000000-0000-4000-8000-000000000000')
        .set('Cookie', cookie)
        .send({ title: 'New title' });

      expect(response.status).toBe(404);
    });

    it('returns 400 for an invalid field value (title too long)', async () => {
      const { user, cookie } = await seedAuthenticatedUser(ctx, { email: 'owner5@example.com' });
      const ownItem = await ctx.propertiesService.create(validCreateBody, user.id);
      ctx.propertiesService.seed([ownItem]);

      const response = await request(app.getHttpServer())
        .patch(`/api/properties/${ownItem.id}`)
        .set('Cookie', cookie)
        .send({ title: 'x'.repeat(161) });

      expect(response.status).toBe(400);
    });

    it('lets the owner update fields, returning isOwn: true and no ownerId leak', async () => {
      const { user, cookie } = await seedAuthenticatedUser(ctx, { email: 'owner6@example.com' });
      const ownItem = await ctx.propertiesService.create(validCreateBody, user.id);
      ctx.propertiesService.seed([ownItem]);

      const response = await request(app.getHttpServer())
        .patch(`/api/properties/${ownItem.id}`)
        .set('Cookie', cookie)
        .send({ title: 'Updated title', price: 300000 });

      expect(response.status).toBe(200);
      expect(response.body.title).toBe('Updated title');
      expect(response.body.price).toBe(300000);
      expect(response.body.isOwn).toBe(true);
      expect(response.body).not.toHaveProperty('ownerId');
      expect(response.body).not.toHaveProperty('externalRef');
    });
  });

  describe('DELETE /api/properties/:id', () => {
    it('returns 401 when no session cookie is sent', async () => {
      const property = makeProperty();
      ctx.propertiesService.seed([property]);

      const response = await request(app.getHttpServer()).delete(`/api/properties/${property.id}`);

      expect(response.status).toBe(401);
    });

    it('returns 403 when the authenticated user does not own the listing', async () => {
      const { cookie } = await seedAuthenticatedUser(ctx);
      const property = makeProperty({ ownerId: null });
      ctx.propertiesService.seed([property]);

      const response = await request(app.getHttpServer()).delete(`/api/properties/${property.id}`).set('Cookie', cookie);

      expect(response.status).toBe(403);
    });

    it('returns 404 for an unknown (but valid) UUID', async () => {
      const { cookie } = await seedAuthenticatedUser(ctx);

      const response = await request(app.getHttpServer())
        .delete('/api/properties/00000000-0000-4000-8000-000000000000')
        .set('Cookie', cookie);

      expect(response.status).toBe(404);
    });

    it('lets the owner delete their listing, returning 204 and no body, then 404 on a follow-up GET', async () => {
      const { user, cookie } = await seedAuthenticatedUser(ctx, { email: 'owner7@example.com' });
      const ownItem = await ctx.propertiesService.create(validCreateBody, user.id);
      ctx.propertiesService.seed([ownItem]);

      const deleteResponse = await request(app.getHttpServer()).delete(`/api/properties/${ownItem.id}`).set('Cookie', cookie);

      expect(deleteResponse.status).toBe(204);
      expect(deleteResponse.body).toEqual({});

      const getResponse = await request(app.getHttpServer()).get(`/api/properties/${ownItem.id}`);

      expect(getResponse.status).toBe(404);
    });
  });
});
