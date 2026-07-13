import 'reflect-metadata';
import { AppDataSource } from './data-source';

async function run(): Promise<void> {
  await AppDataSource.initialize();
  try {
    const applied = await AppDataSource.runMigrations();
    if (applied.length === 0) {
      console.log('[migrate] No pending migrations.');
    } else {
      for (const migration of applied) {
        console.log(`[migrate] Applied migration: ${migration.name}`);
      }
    }
  } finally {
    await AppDataSource.destroy();
  }
}

run()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error('[migrate] Migration failed:', error);
    process.exit(1);
  });
