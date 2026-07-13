import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds a nullable `ownerId` column to `properties` for user-created listings
 * (POST /api/properties). Seeded rows keep `ownerId` NULL. FK -> users(id)
 * ON DELETE SET NULL so deleting the owning user detaches the listing
 * instead of deleting it.
 */
export class AddOwnerToProperties1731600000000 implements MigrationInterface {
  name = 'AddOwnerToProperties1731600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "properties" ADD COLUMN "ownerId" uuid`);
    await queryRunner.query(
      `ALTER TABLE "properties" ADD CONSTRAINT "FK_properties_ownerId" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE SET NULL`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_properties_ownerId" ON "properties" ("ownerId")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_properties_ownerId"`);
    await queryRunner.query(`ALTER TABLE "properties" DROP CONSTRAINT IF EXISTS "FK_properties_ownerId"`);
    await queryRunner.query(`ALTER TABLE "properties" DROP COLUMN IF EXISTS "ownerId"`);
  }
}
