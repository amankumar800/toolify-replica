import { defineConfig } from 'vitest/config';
import { loadEnv } from 'vite';
import path from 'path';

export default defineConfig(({ mode }) => {
  // Load env files based on mode
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    test: {
      globals: true,
      environment: 'node',
      include: ['**/*.test.ts', '**/*.spec.ts'],
      exclude: ['node_modules', '.next'],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html'],
      },
      env: {
        ...env,
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  };
});
