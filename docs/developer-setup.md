# Developer Setup

This guide gets a local Cardinal development environment running against a real Home Assistant instance.

---

## Prerequisites

- Git
- Node.js 20 or later — [nodejs.org](https://nodejs.org)
- pnpm — [pnpm.io](https://pnpm.io)
- A Home Assistant instance you can access the config directory of

### Install pnpm

If you have Node.js installed but not pnpm:

```sh
npm install -g pnpm
```

Or via Homebrew on macOS:

```sh
brew install pnpm
```

Verify both are installed:

```sh
node --version   # 20.x or later
pnpm --version   # 9.x or later
```

---

## Clone and install

```sh
git clone https://github.com/eli-stone/cardinal
cd cardinal
pnpm install
```

`pnpm install` fetches all dependencies for every package in the monorepo. It runs once — subsequent commands don't need it unless `package.json` files change.

---

## Connect to Home Assistant

Cardinal runs as a custom integration inside HA. The frontend JS is served by HA, not by a local dev server. To develop against a real HA instance you need to make the integration visible to it.

### Symlink the integration (same machine)

If your HA config directory is on the same machine as the codebase, use a symlink. This is the recommended path — changes appear in HA immediately after a browser refresh with no copying needed.

```sh
ln -s /path/to/cardinal/apps/integration/custom_components/cardinal \
      /path/to/ha-config/custom_components/cardinal
```

Common config directory locations:

| HA install type | Config directory |
| --- | --- |
| Home Assistant OS (HAOS) | `/config` (inside the VM/container) |
| Supervised | `/usr/share/hassio/homeassistant` |
| Docker | Whatever you mounted — check your `compose.yml` |
| Core (venv) | The directory you passed with `--config` |

### Copy files (different machine)

If HA runs on a separate machine, copy the integration after each build:

```sh
# Build first
pnpm build --filter @cardinal/frontend

# Copy to HA
scp -r apps/integration/custom_components/cardinal \
        user@homeassistant:/path/to/ha-config/custom_components/
```

For active development, the symlink approach on the same machine is strongly preferred.

---

## Register Cardinal in Home Assistant

After placing the integration files, restart Home Assistant once:

- In the UI: **Settings → System → Restart**

Then add the integration:

1. Go to **Settings → Integrations**
2. Click **+ Add Integration**
3. Search for **Cardinal**
4. Complete the setup form — see [manual-installation.md](manual-installation.md#configure-cardinal) for full details on mapping entity IDs

Once saved, **Cardinal** appears in the sidebar.

---

## Start the development watcher

```sh
pnpm dev
```

This starts Vite in watch mode. On every file save, Vite rebuilds the frontend bundle directly into `apps/integration/custom_components/cardinal/frontend/`. Because you symlinked the directory, HA serves the updated file immediately.

**Edit → Save → Refresh the HA browser tab.** That is the entire loop.

The watcher resolves all workspace packages directly from their TypeScript source — no separate compile step needed for `packages/core`, `packages/ui`, etc. A change anywhere in the monorepo triggers a rebuild.

---

## Running other commands

```sh
pnpm test          # Run all tests
pnpm lint          # Lint all packages
pnpm type-check    # TypeScript type-check across the monorepo
pnpm build         # Full production build (all packages)
pnpm package       # Build a release ZIP (see docs/RELEASE.md)
```

---

## Debugging

### Browser console logs

In development mode (`pnpm dev`), Cardinal logs to the browser console:

| Log | When |
| --- | --- |
| `[Cardinal] Mounting panel with entity mapping: {...}` | Panel first loads — shows which entity IDs are configured |
| `[Cardinal] Connection status changed: connected` | WebSocket established or re-established |
| `[Cardinal] Snapshot received: { solar: ..., battery: ..., ... }` | Every sensor update from HA |
| `[Cardinal] Sensor health issues: [...]` | When any configured sensor is missing, unavailable, or invalid |

These logs are stripped from production builds.

### Home Assistant logs

If the integration fails to load, check **Settings → System → Logs** and filter for `cardinal`.

To get more detail, add this to `configuration.yaml` and restart HA:

```yaml
logger:
  default: warning
  logs:
    custom_components.cardinal: debug
```

### Verifying sensor values

**Developer Tools → States** in the HA UI lets you inspect any entity's current value and unit. Use this to verify that the entity IDs you configured produce the values you expect before debugging Cardinal itself.

---

## Project structure

```
apps/
  frontend/       Vue application — builds to integration/frontend/
  integration/    Home Assistant custom component (Python)

packages/
  domain/         Domain models — EnergySnapshot, DailySummary, etc.
  core/           Business logic — insight generation, calculations
  providers/      HA WebSocket integration, entity translation
  ui/             Reusable Vue components

docs/             Architecture and process documentation
tests/
  integration/    Integration tests using real fixture data
  screenshots/    Playwright screenshot generation
```

`packages/domain` is the single source of truth. Business logic lives in `packages/core` and has no knowledge of Vue or Home Assistant. The HA integration layer is confined to `packages/providers`.

See `docs/architecture.md` for more detail.

---

## Common issues during development

**"Cardinal" does not appear after symlinking**

Verify the symlink target is correct and that HA restarted after you created it. Check **Settings → Integrations** — if Cardinal is not listed there, HA did not find the component.

**Panel loads but shows stale data after an edit**

The browser may be caching the old bundle. Hard-reload the tab (Cmd+Shift+R / Ctrl+Shift+R) or disable cache in DevTools (Network tab → "Disable cache").

**Vite watcher exits unexpectedly**

Restart `pnpm dev`. The watcher has no persistent state — a clean restart picks up where it left off.

**Type errors in the IDE after changing a workspace package**

The IDE resolves types from `packages/*/dist/`. Run `pnpm build` once to update the compiled output, then the IDE will reflect the latest types. The watcher itself does not need this — it reads source directly.

For problems after installation, see [TROUBLESHOOTING.md](TROUBLESHOOTING.md).
