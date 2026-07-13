import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Creates the `users` and `properties` tables plus the indexes needed for
 * lookups/filters. Postgres 13+ ships `gen_random_uuid()` in core, so no
 * extension is required.
 */
export class Init1731500000000 implements MigrationInterface {
  name = 'Init1731500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" varchar(80) NOT NULL,
        "email" varchar NOT NULL,
        "passwordHash" varchar NOT NULL,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE UNIQUE INDEX "UQ_users_email" ON "users" ("email")`);

    await queryRunner.query(`
      CREATE TABLE "properties" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "externalRef" varchar NOT NULL,
        "title" varchar NOT NULL,
        "description" text NOT NULL,
        "price" numeric(12,2) NOT NULL,
        "address" varchar NOT NULL,
        "city" varchar NOT NULL,
        "country" varchar NOT NULL DEFAULT 'Estonia',
        "bedrooms" integer NOT NULL,
        "bathrooms" integer NOT NULL,
        "areaSqm" numeric(8,2) NOT NULL,
        "propertyType" varchar NOT NULL,
        "features" text,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE UNIQUE INDEX "UQ_properties_externalRef" ON "properties" ("externalRef")`);
    await queryRunner.query(`CREATE INDEX "IDX_properties_city" ON "properties" ("city")`);
    await queryRunner.query(`CREATE INDEX "IDX_properties_bedrooms" ON "properties" ("bedrooms")`);
    await queryRunner.query(`CREATE INDEX "IDX_properties_propertyType" ON "properties" ("propertyType")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "properties"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
  }
}
