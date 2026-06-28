import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const packagesDir = path.resolve(__dirname, '../../packages')

export default defineConfig(({ mode }) => {
  const isDev = mode !== 'production'

  return {
    // cssInjectedByJsPlugin inlines the extracted CSS back into the JS bundle
    // as a self-executing <style> injection.  Without this, Vite outputs a
    // hashed CSS file (assets/main-[hash].css) whose relative path cannot be
    // resolved when HA loads cardinal-panel.js from its panel URL — resulting
    // in all CSS being silently dropped and every CSS variable being undefined.
    plugins: [
      vue(),
      // styleId gives the injected <style> a stable ID so that connectedCallback
      // in main.ts can find and clone it into the correct shadow root at runtime.
      cssInjectedByJsPlugin({ styleId: 'cardinal-styles' }),
    ],

    // Always resolve workspace packages from source so Vite processes every
    // Vue SFC end-to-end, including <style scoped> blocks.  Without this,
    // production builds resolve @cardinal/ui to its pre-built dist/index.js,
    // whose CSS was extracted to dist/index.css by the library build — a file
    // the frontend app never imports.  cssInjectedByJsPlugin only injects CSS
    // that Vite itself collected, so all component styles would be silently
    // dropped from the bundle.
    resolve: {
      alias: {
        '@cardinal/domain': path.join(packagesDir, 'domain/src/index.ts'),
        '@cardinal/core': path.join(packagesDir, 'core/src/index.ts'),
        '@cardinal/simulation': path.join(packagesDir, 'simulation/src/index.ts'),
        '@cardinal/providers': path.join(packagesDir, 'providers/src/index.ts'),
        '@cardinal/ui': path.join(packagesDir, 'ui/src/index.ts'),
      },
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
