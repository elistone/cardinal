import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const packagesDir = path.resolve(__dirname, '../../packages')

export default defineConfig(({ mode }) => {
  const isDev = mode !== 'production'

  return {
    plugins: [vue()],

    // In dev mode, resolve workspace packages directly from source so that
    // Vite's watcher covers the full source tree — no pre-build step needed
    // and edits to any package trigger an immediate rebuild.
    resolve: {
      alias: isDev
        ? {
            '@cardinal/domain': path.join(packagesDir, 'domain/src/index.ts'),
            '@cardinal/core': path.join(packagesDir, 'core/src/index.ts'),
            '@cardinal/providers': path.join(packagesDir, 'providers/src/index.ts'),
            '@cardinal/ui': path.join(packagesDir, 'ui/src/index.ts'),
          }
        : {},
    },

    build: {
      outDir: '../integration/custom_components/cardinal/frontend',
      emptyOutDir: true,
      sourcemap: isDev ? 'inline' : false,
      minify: !isDev,
      rollupOptions: {
        input: 'src/main.ts',
        output: {
          entryFileNames: 'cardinal-panel.js',
          format: 'es',
        },
      },
    },
  }
})
