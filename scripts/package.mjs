#!/usr/bin/env node
/**
 * Produces dist/cardinal-{version}.zip — a self-contained archive of the
 * custom_components/cardinal integration, ready for manual HA installation.
 *
 * Extracts to:
 *   <ha-config>/custom_components/cardinal/
 *
 * Run via: pnpm package
 */

import { execSync } from 'node:child_process'
import { mkdirSync, rmSync, existsSync, readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const integrationDir = resolve(root, 'apps/integration')
const frontendOutputDir = resolve(integrationDir, 'custom_components/cardinal/frontend')
const manifestPath = resolve(integrationDir, 'custom_components/cardinal/manifest.json')
const distDir = resolve(root, 'dist')

// ── 1. Read version ────────────────────────────────────────────────────────────

const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
const { version } = manifest
const zipName = `cardinal-${version}.zip`
const zipPath = resolve(distDir, zipName)

console.log(`Packaging cardinal v${version}…\n`)

// ── 2. Build workspace dependencies (turbo, cached) ───────────────────────────
// Build domain / core / providers / ui first so their dist/ is up to date.
// The frontend is intentionally excluded — we rebuild it fresh below.

execSync(
  'pnpm exec turbo run build --filter @cardinal/domain --filter @cardinal/core --filter @cardinal/providers --filter @cardinal/ui',
  { cwd: root, stdio: 'inherit' },
)

// ── 3. Clean integration frontend dir and rebuild fresh ───────────────────────
// Always run a clean production Vite build so no stale dev-mode artifacts
// (different CSS hashes, inline source maps, etc.) end up in the archive.

rmSync(frontendOutputDir, { recursive: true, force: true })

execSync('pnpm exec vite build', {
  cwd: resolve(root, 'apps/frontend'),
  stdio: 'inherit',
})

// ── 4. Create archive ─────────────────────────────────────────────────────────

mkdirSync(distDir, { recursive: true })
if (existsSync(zipPath)) rmSync(zipPath)

execSync(
  [
    'zip', '-r', zipPath,
    'custom_components/cardinal',
    '--exclude', '*/\__pycache__/*',
    '--exclude', '*.pyc',
    '--exclude', '*/.DS_Store',
  ].join(' '),
  { cwd: integrationDir, stdio: 'inherit' },
)

console.log(`\n✓ dist/${zipName}`)
