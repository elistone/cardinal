import { defineConfig } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const storybookStatic = path.resolve(__dirname, '../../packages/ui/storybook-static')

export default defineConfig({
  testDir: './src',
  timeout: 30_000,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:6009',
    viewport: { width: 1280, height: 800 },
    colorScheme: 'dark',
  },
  webServer: {
    command: `python3 -m http.server 6009 -d ${storybookStatic}`,
    port: 6009,
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
})
