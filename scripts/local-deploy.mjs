#!/usr/bin/env node
/**
 * Deploys the Cardinal integration to a local Home Assistant instance over SSH.
 *
 * Default method: scp (works on a standard Home Assistant OS installation).
 * Optional:       set HA_DEPLOY_METHOD=rsync if rsync is available on the host.
 *
 * Configuration comes from .env.local in the repo root (gitignored).
 * See .env.example for all available variables.
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
const method = process.env.HA_DEPLOY_METHOD ?? 'scp'

if (!host) {
  console.error('Error: HA_HOST is not set.')
  console.error('Create a .env.local file based on .env.example and set HA_HOST to your HA IP or hostname.')
  process.exit(1)
}

const remote = `${username}@${host}`
const remoteDest = `${configPath}/custom_components`
const src = resolve(root, 'apps/integration/custom_components/cardinal')

// Shared SSH options — used in both methods and for the optional restart
const sshArgs = `-p ${port} -o StrictHostKeyChecking=accept-new`

// ── Build ────────────────────────────────────────────────────────────────────

console.log('Building frontend (production)...')
execSync("pnpm turbo build --filter='!@cardinal/frontend'", { cwd: root, stdio: 'inherit' })
execSync('pnpm exec vite build', { cwd: resolve(root, 'apps/frontend'), stdio: 'inherit' })

// ── Deploy ───────────────────────────────────────────────────────────────────

console.log(`\nDeploying to ${remote}:${remoteDest}/cardinal (method: ${method})...`)

if (method === 'rsync') {
  // rsync is not installed on Home Assistant OS by default.
  // Only use this if you have rsync available on the host.
  const rsyncSsh = `ssh ${sshArgs}`
  execSync(
    `rsync -avz --delete -e "${rsyncSsh}" "${src}/" "${remote}:${remoteDest}/cardinal/"`,
    { stdio: 'inherit' },
  )
} else {
  // scp — works on a standard Home Assistant OS installation with no extra packages.

  // Step 1: Remove the existing installation so no stale files remain.
  console.log('  Removing existing installation...')
  execSync(
    `ssh ${sshArgs} ${remote} "rm -rf ${remoteDest}/cardinal && mkdir -p ${remoteDest}"`,
    { stdio: 'inherit' },
  )

  // Step 2: Copy the new files.
  console.log('  Copying files...')
  execSync(
    `scp -r -P ${port} -o StrictHostKeyChecking=accept-new "${src}" "${remote}:${remoteDest}/"`,
    { stdio: 'inherit' },
  )
}

// ── Optional restart ─────────────────────────────────────────────────────────

if (restart) {
  console.log('\nRestarting Home Assistant...')
  execSync(`ssh ${sshArgs} ${remote} "ha core restart"`, { stdio: 'inherit' })
  console.log('Restart triggered — wait ~30 seconds, then refresh your browser.')
} else {
  console.log('\nDone. Restart Home Assistant to apply the changes:')
  console.log('  Settings → System → Restart')
  console.log('\nTip: set HA_RESTART=true in .env.local to restart automatically.')
}
