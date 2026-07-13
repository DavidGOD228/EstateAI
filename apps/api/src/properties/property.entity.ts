import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  ValueTransformer,
} from 'typeorm';

/**
 * Seam contract: the Property shape consumed by the AI module.
 * Path, class name, and field names/types are kept exactly as the Foundation
 * stub specified (they mirror the frozen PropertyDto in packages/shared-types).
 */
export type PropertyType = 'apartment' | 'house' | 'studio' | 'townhouse';

/**
 * Postgres `numeric` columns are returned by the driver as strings to avoid
 * silent precision loss; we deliberately want plain JS numbers on the entity,
 * so every numeric column uses this transformer.
 */
const numericTransformer: ValueTransformer = {
  to: (value?: number | null) => value,
  from: (value?: string | null) => (value === null || value === undefined ? value : parseFloat(value)),
};

@Entity({ name: 'properties' })
export class Property {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Natural key for idempotent seeding; excluded from API responses. */
  @Column({ type: 'varchar', unique: true })
  externalRef: string;

  @Column({ type: 'varchar' })
  title: string;

  @Column({ type: 'text' })
  description: string;

  /** EUR. */
  @Column({ type: 'numeric', precision: 12, scale: 2, transformer: numericTransformer })
  price: number;

  @Column({ type: 'varchar' })
  address: string;

  @Index()
  @Column({ type: 'varchar' })
  city: string;

  @Column({ type: 'varchar', default: 'Estonia' })
  country: string;

  @Index()
  @Column({ type: 'int' })
  bedrooms: number;

  @Column({ type: 'int' })
  bathrooms: number;

  @Column({ type: 'numeric', precision: 8, scale: 2, transformer: numericTransformer })
  areaSqm: number;

  @Index()
  @Column({ type: 'varchar' })
  propertyType: PropertyType;

  /** Display-only tags; never filtered on (see docs/TECHNICAL_PLAN.md §13). */
  @Column({ type: 'simple-array', nullable: true })
  features: string[];

  /**
   * Owning user id for user-created listings (POST /api/properties).
   * NULL for all seeded rows. FK -> users(id) ON DELETE SET NULL: deleting
   * the owning user detaches the listing rather than deleting it. Never
   * serialized in API responses — see `toPropertyResponse`'s `isOwn` mapping.
   */
  @Index()
  @Column({ type: 'uuid', nullable: true })
  ownerId: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
