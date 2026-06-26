import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/stores/**/*.ts', 'src/components/**/*.vue'],
      exclude: ['src/**/*.test.ts'],
      thresholds: {
        lines: 80,
        branches: 75,
        functions: 80,
      },
    },
  },
})
