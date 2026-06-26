import { test, expect } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT_DIR = path.resolve(__dirname, '../../../docs/screenshots')

// Ensure the output directory exists
fs.mkdirSync(OUT_DIR, { recursive: true })

// Story iframe URL helper — uses the Storybook iframe to get a clean, chrome-free render
function storyUrl(id: string): string {
  return `/iframe.html?id=${id}&viewMode=story`
}

// Each entry: [output filename, story ID]
const stories = [
  ['0001-now-live.png',             'layout-now-panel--charging-from-solar'],
  ['0002-loading.png',              'layout-now-panel--loading'],
  ['0003-no-configuration.png',     'layout-now-panel--no-configuration'],
  ['0004-disconnected.png',         'layout-now-panel--disconnected'],
  ['0005-exporting-solar.png',      'layout-now-panel--exporting-solar'],
  ['0006-running-on-battery.png',   'layout-now-panel--battery-discharging'],
  ['0007-grid-power.png',           'layout-now-panel--grid-power-overnight'],
  ['0008-health-overlay.png',       'layout-now-panel--with-sensor-health-overlay'],
] as const

for (const [filename, storyId] of stories) {
  test(`screenshot: ${filename}`, async ({ page }) => {
    await page.goto(storyUrl(storyId))

    // Wait for Storybook's story root to become visible (hidden attribute removed when story is ready)
    await page.waitForSelector('#storybook-root:not([hidden])', { timeout: 15_000 })
    await page.waitForTimeout(400)

    const screenshot = await page.screenshot({ fullPage: true })
    fs.writeFileSync(path.join(OUT_DIR, filename), screenshot)

    // Verify a non-empty image was captured
    expect(screenshot.length).toBeGreaterThan(1000)
  })
}
