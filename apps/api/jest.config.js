/**
 * Hermetic test config for @estateai/api: no live Postgres, no live Anthropic.
 * ts-jest gets its own self-contained tsconfig fragment (below) instead of
 * extending ../tsconfig.json, whose `include: ["src"]` intentionally excludes
 * this directory — that file stays untouched and `pnpm typecheck` (which only
 * covers `src`) is unaffected by anything here.
 *
 * `isolatedModules: true` mirrors the project's own `dev` script
 * (`ts-node --transpile-only`), which already proves per-file transpilation
 * (no cross-file type-checking) is sufficient for Nest's decorator-metadata
 * based DI in this codebase.
 */
module.exports = {
  testEnvironment: 'node',
  rootDir: '.',
  roots: ['<rootDir>/test'],
  testMatch: ['<rootDir>/test/**/*.spec.ts'],
  setupFiles: ['<rootDir>/test/setup-env.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        tsconfig: {
          isolatedModules: true,
          target: 'es2022',
          module: 'node16',
          moduleResolution: 'node16',
          lib: ['es2022'],
          experimentalDecorators: true,
          emitDecoratorMetadata: true,
          esModuleInterop: true,
          resolveJsonModule: true,
          skipLibCheck: true,
          strict: false,
          types: ['jest', 'node'],
        },
      },
    ],
  },
  clearMocks: true,
  restoreMocks: true,
  testTimeout: 15000,
  verbose: false,
  maxWorkers: '50%',
};
