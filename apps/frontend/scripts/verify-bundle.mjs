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

// CSS class selectors that must be present as actual rules in the injected CSS.
// Searching with the leading dot distinguishes CSS rules from JS template strings
// (template code uses the class name without a dot, e.g. "metric-card").
const REQUIRED_SELECTORS = [
  '.metric-card',
  '.insight-block',
  '.energy-flow',
  '.sensor-health',
  '.now-panel',
  '.cardinal-app',
]

// The injected <style> must have a stable ID so connectedCallback() can clone
// it into the correct shadow root at runtime.
const REQUIRED_STRINGS = [
  '"cardinal-styles"',
]

if (!existsSync(bundlePath)) {
  console.error(`Bundle not found: ${bundlePath}`)
  console.error('Run `pnpm build` first.')
  process.exit(1)
}

const bundle = readFileSync(bundlePath, 'utf8')

let passed = 0
let failed = 0

console.log('CSS selectors:')
for (const selector of REQUIRED_SELECTORS) {
  if (bundle.includes(selector)) {
    console.log(`  ✓ ${selector}`)
    passed++
  } else {
    console.error(`  ✗ ${selector}  (missing)`)
    failed++
  }
}

console.log('\nShadow DOM injection:')
for (const str of REQUIRED_STRINGS) {
  if (bundle.includes(str)) {
    console.log(`  ✓ ${str}`)
    passed++
  } else {
    console.error(`  ✗ ${str}  (missing — styles will not be cloned into shadow root)`)
    failed++
  }
}

console.log()

const total = REQUIRED_SELECTORS.length + REQUIRED_STRINGS.length

if (failed > 0) {
  console.error(
    `\nBundle verification failed: ${failed}/${total} check${failed === 1 ? '' : 's'} did not pass.`,
  )
  process.exit(1)
}

console.log(`\nBundle verification passed (${passed}/${total}).`)
