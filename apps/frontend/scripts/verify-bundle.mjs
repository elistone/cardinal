#!/usr/bin/env node
/**
 * Verifies that required CSS selectors are present in the production bundle.
 *
 * Run after `pnpm build`. Exits with code 1 if any selector is missing.
 *
 * CSS class selectors appear with a leading dot inside the injected CSS string
 * (e.g. `.metric-card[data-v-abc123]{`).  JS template code references class
 * names as plain strings without a dot (e.g. `"metric-card"`), so searching
 * for `.selector-name` reliably distinguishes CSS rules from template code.
 */

import { readFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const bundlePath = resolve(
  __dirname,
  '../../integration/custom_components/cardinal/frontend/cardinal-panel.js',
)

const REQUIRED_SELECTORS = [
  '.metric-card',
  '.insight-block',
  '.energy-flow',
  '.sensor-health',
  '.now-panel',
  '.cardinal-app',
]

if (!existsSync(bundlePath)) {
  console.error(`Bundle not found: ${bundlePath}`)
  console.error('Run `pnpm build` first.')
  process.exit(1)
}

const bundle = readFileSync(bundlePath, 'utf8')

let passed = 0
let failed = 0

for (const selector of REQUIRED_SELECTORS) {
  if (bundle.includes(selector)) {
    console.log(`  ✓ ${selector}`)
    passed++
  } else {
    console.error(`  ✗ ${selector}  (missing)`)
    failed++
  }
}

console.log()

if (failed > 0) {
  console.error(
    `Bundle verification failed: ${failed} selector${failed === 1 ? '' : 's'} missing from production build.`,
  )
  console.error(
    'This usually means a component\'s CSS was not processed by Vite.',
  )
  console.error('Check that all @cardinal/* packages are aliased to source in vite.config.ts.')
  process.exit(1)
}

console.log(`Bundle verification passed (${passed}/${passed} selectors present).`)
