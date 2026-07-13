import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Deliberately NOT merged with vite.config.ts to avoid coupling the test
// runner config to the app's build config (e.g. tailwindcss()/dev server).
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@estateai/shared-types': fileURLToPath(
        new URL('../../packages/shared-types/src/index.ts', import.meta.url),
      ),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    globals: true,
  },
});
