import { randomUUID } from 'node:crypto';
import { User } from '../../src/users/user.entity';

interface FindOneOptions {
  where: Partial<Pick<User, 'id' | 'email'>>;
}

/**
 * Minimal in-memory stand-in for `Repository<User>`, implementing only the
 * methods `AuthService` actually calls (`findOne`, `create`, `save`). Used
 * via `overrideProvider(getRepositoryToken(User))` so the real TypeORM
 * repository — and the Postgres connection behind it — never gets built.
 */
export class FakeUserRepository {
  private readonly rows = new Map<string, User>();

  create(partial: Partial<User>): User {
    return { ...partial } as User;
  }

  async save(entity: User): Promise<User> {
    const now = new Date();
    const existing = entity.id ? this.rows.get(entity.id) : undefined;
    const saved: User = {
      id: entity.id ?? randomUUID(),
      name: entity.name,
      email: entity.email,
      passwordHash: entity.passwordHash,
      createdAt: existing?.createdAt ?? entity.createdAt ?? now,
      updatedAt: now,
    };
    this.rows.set(saved.id, saved);
    return saved;
  }

  async findOne(options: FindOneOptions): Promise<User | null> {
    const { where } = options;
    for (const row of this.rows.values()) {
      if (where.id !== undefined && row.id !== where.id) continue;
      if (where.email !== undefined && row.email !== where.email) continue;
      return row;
    }
    return null;
  }

  seed(user: User): void {
    this.rows.set(user.id, user);
  }

  clear(): void {
    this.rows.clear();
  }
}
