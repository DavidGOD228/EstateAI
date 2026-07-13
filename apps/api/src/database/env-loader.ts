import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Minimal .env loader for standalone scripts (migrate/seed/data-source) that
 * run outside Nest's ConfigModule. No new dependencies: parses simple
 * KEY=VALUE lines and only fills in vars not already set in the environment
 * (so real shell/Docker env vars always win).
 *
 * Mirrors ConfigModule's envFilePath: ['../../.env', '.env'] so it behaves
 * the same whether the process cwd is `apps/api` (the normal case for
 * `pnpm --filter api ...` and the compiled Docker entrypoint) or the repo
 * root.
 */
export function loadEnvIfMissing(): void {
  for (const candidate of [resolve(process.cwd(), '../../.env'), resolve(process.cwd(), '.env')]) {
    if (existsSync(candidate)) {
      applyEnvFile(candidate);
    }
  }
}

function applyEnvFile(path: string): void {
  const contents = readFileSync(path, 'utf-8');
  for (const rawLine of contents.split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) {
      continue;
    }

    const separatorIndex = line.indexOf('=');
    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}
