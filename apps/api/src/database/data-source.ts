import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Property } from '../properties/property.entity';
import { User } from '../users/user.entity';
import { loadEnvIfMissing } from './env-loader';
import { Init1731500000000 } from './migrations/1731500000000-init';
import { AddOwnerToProperties1731600000000 } from './migrations/1731600000000-add-owner-to-properties';

loadEnvIfMissing();

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL is not set. Provide it via the environment or the repo-root .env file.');
}

/**
 * Standalone DataSource for migrate.ts/seed.ts, which run outside Nest's DI
 * container. Migrations (and entities) are registered via imported classes,
 * never glob paths, so this works identically under ts-node and compiled
 * (node dist/database/migrate.js).
 */
export const AppDataSource = new DataSource({
  type: 'postgres',
  url: databaseUrl,
  entities: [User, Property],
  migrations: [Init1731500000000, AddOwnerToProperties1731600000000],
  synchronize: false,
  logging: false,
});

export default AppDataSource;
