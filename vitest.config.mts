import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

/**
 * The `@/*` path alias is declared in tsconfig.json for Next.js; vitest needs it
 * spelled out separately so the test run resolves the same imports.
 */
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    include: ['src/**/*.test.ts'],
  },
})
