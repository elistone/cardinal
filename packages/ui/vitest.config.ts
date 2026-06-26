import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    include: ['src/**/*.test.ts'],
    passWithNoTests: true,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts', 'src/**/*.vue'],
      exclude: ['src/**/*.test.ts', 'src/index.ts'],
      thresholds: {
        lines: 70,
      },
    },
  },
})
