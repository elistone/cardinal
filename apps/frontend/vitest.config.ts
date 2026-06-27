import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const packagesDir = path.resolve(__dirname, '../../packages')

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@cardinal/domain':    path.join(packagesDir, 'domain/src/index.ts'),
      '@cardinal/core':      path.join(packagesDir, 'core/src/index.ts'),
      '@cardinal/providers': path.join(packagesDir, 'providers/src/index.ts'),
      '@cardinal/ui':        path.join(packagesDir, 'ui/src/index.ts'),
    },
  },
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
