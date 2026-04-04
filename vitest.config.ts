import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  css: false, // Skip CSS processing (Vitest doesn't need it for unit tests)
  test: {
    globals: true,
    environment: 'node', // Use node environment for lib/* tests (no DOM needed)
    setupFiles: ['./vitest.setup.ts'],
    include: ['**/*.{test,spec}.{ts,tsx}'],
    exclude: [
      '**/node_modules/**',
      '**/.next/**',
      '**/tests/**', // Exclude Playwright E2E tests
      '**/dist/**',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov', 'json'],
      reportsDirectory: './coverage',
      include: ['lib/**/*.ts', 'app/api/**/*.ts', 'components/**/*.{ts,tsx}'],
      exclude: [
        '**/*.d.ts',
        '**/*.config.ts',
        '**/node_modules/**',
        '**/.next/**',
        '**/coverage/**',
        '**/tests/**',
        '**/dist/**',
      ],
      // Coverage thresholds (CRITICAL)
      // Phase 1: ~12% overall (5 critical lib files completed)
      // Target: Will increase to 80% in Phase 2-4 as we add API/component tests
      thresholds: {
        lines: 12,
        functions: 20,
        branches: 75,
        statements: 12,
        // 100% coverage for critical files
        'lib/auth.server.ts': {
          lines: 100,
          functions: 100,
          branches: 100,
          statements: 100,
        },
        'lib/table-assignment.ts': {
          lines: 100,
          functions: 100,
          branches: 100,
          statements: 100,
        },
        'lib/usage.ts': {
          lines: 100,
          functions: 100,
          branches: 100,
          statements: 100,
        },
        'lib/prisma-guards.ts': {
          lines: 100,
          functions: 100,
          branches: 97.91, // Line 150 has unreachable '|| Unknown' fallback (early return on line 143)
          statements: 100,
        },
        'lib/auth.client.ts': {
          lines: 100,
          functions: 100,
          branches: 100,
          statements: 100,
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
})
