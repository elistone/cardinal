#!/usr/bin/env node
/**
 * Deploys the Cardinal integration to a local Home Assistant instance via rsync over SSH.
 *
 * Configuration comes from .env.local in the repo root (gitignored).
 * See .env.example for available variables.
 *
 * Usage: pnpm local:deploy
 */

import { execSync } from 'child_process'
import { existsSync, readFileSync } from 'fs'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

// Load .env.local
const envFile = resolve(root, '.env.local')
if (existsSync(envFile)) {
  for (const line of readFileSync(envFile, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq < 0) continue
    const key = trimmed.slice(0, eq).trim()
    const val = trimmed.slice(eq + 1).trim()
    if (!(key in process.env)) process.env[key] = val
  }
}

const host = process.env.HA_HOST
const port = process.env.HA_PORT ?? '22'
const username = process.env.HA_USERNAME ?? 'root'
const configPath = process.env.HA_CONFIG_PATH ?? '/config'
const restart = process.env.HA_RESTART === 'true'

if (!host) {
  console.error('Error: HA_HOST is not set.')
  console.error('Create a .env.local file based on .env.example and set HA_HOST to your HA IP or hostname.')
  process.exit(1)
}

const src = resolve(root, 'apps/integration/custom_components/cardinal')
const dest = `${username}@${host}:${configPath}/custom_components/cardinal`
const ssh = `ssh -p ${port} -o StrictHostKeyChecking=accept-new`

console.log('Building frontend (production)...')
// Build workspace packages first, then the frontend
execSync("pnpm turbo build --filter='!@cardinal/frontend'", { cwd: root, stdio: 'inherit' })
execSync('pnpm exec vite build', { cwd: resolve(root, 'apps/frontend'), stdio: 'inherit' })

console.log(`\nDeploying to ${username}@${host}:${configPath}/custom_components/cardinal ...`)
execSync(`rsync -avz --delete -e "${ssh}" "${src}/" "${dest}/"`, { stdio: 'inherit' })

if (restart) {
  console.log('\nRestarting Home Assistant...')
  execSync(`${ssh} ${username}@${host} "ha core restart"`, { stdio: 'inherit' })
  console.log('Restart triggered — wait ~30 seconds, then refresh your browser.')
} else {
  console.log('\nDone. Restart Home Assistant to apply the changes.')
  console.log('  Settings → System → Restart')
  console.log('\nOr re-run with HA_RESTART=true in .env.local to restart automatically.')
}
