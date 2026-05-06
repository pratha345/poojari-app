// frontend/vitest.config.js
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment:  'jsdom',
    globals:      true,
    setupFiles:   ['./src/test/setup.js'],
    css:          true,
    // Suppress React act() warnings in CI
    silent: false,
    coverage: {
      provider:   'v8',
      reporter:   ['text', 'html', 'lcov'],
      include:    ['src/components/**', 'src/pages/**', 'src/context/**'],
      exclude:    ['src/test/**', 'src/**/__tests__/**'],
    },
  },
  resolve: {
    alias: {
      // Allow bare CSS module imports to resolve in tests
    },
  },
});
