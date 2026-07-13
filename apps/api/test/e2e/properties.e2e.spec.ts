import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { createTestApp, TestAppContext } from '../support/build-test-app';
import { makeProperty } from '../support/fixtures';

describe('Properties (e2e)', () => {
  let ctx: TestAppContext;
  let app: INestApplication;

  beforeAll(async () => {
    ctx = await createTestApp();
    app = ctx.app;
  });

  afterEach(() => {
    ctx.propertiesService.clear();
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
});
