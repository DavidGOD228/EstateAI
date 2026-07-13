import { randomUUID } from 'node:crypto';
import { Property } from '../../src/properties/property.entity';
import { User } from '../../src/users/user.entity';

export function makeProperty(overrides: Partial<Property> = {}): Property {
  const now = new Date('2026-01-01T00:00:00.000Z');
  const property = new Property();
  Object.assign(property, {
    id: randomUUID(),
    externalRef: `ext-${randomUUID()}`,
    title: 'Bright two-bedroom flat in Kadriorg',
    description: 'A bright, recently renovated flat close to Kadriorg park.',
    price: 245000,
    address: 'Weizenbergi 12',
    city: 'Tallinn',
    country: 'Estonia',
    bedrooms: 2,
    bathrooms: 1,
    areaSqm: 68,
    propertyType: 'apartment',
    features: ['balcony', 'parking'],
    ownerId: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  });
  return property;
}

export function makeUser(overrides: Partial<User> = {}): User {
  const now = new Date('2026-01-01T00:00:00.000Z');
  const user = new User();
  Object.assign(user, {
    id: randomUUID(),
    name: 'Jane Doe',
    email: 'jane@example.com',
    passwordHash: 'argon2-hash-placeholder',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  });
  return user;
}
