# Installing Cardinal

Cardinal is a Home Assistant custom integration that adds an energy explanation panel to your sidebar.

This guide covers installation from a local checkout — both for active development and for a one-time install.

---

## Prerequisites

- Home Assistant 2024.1 or later
- Node.js 20 or later
- pnpm 9 or later
- A Home Assistant installation you can access the filesystem of (local, VM, or container with volume access)

---

## Development workflow (recommended)

If your Home Assistant config directory is on the same machine as the codebase, this is the fastest path:

```sh
git clone https://github.com/eli-stone/cardinal
cd cardinal
pnpm install
```

Then symlink the integration directory into Home Assistant:

```sh
ln -s /path/to/cardinal/apps/integration/custom_components/cardinal \
      /path/to/ha-config/custom_components/cardinal
```

Restart Home Assistant, add the integration, and then start the development watcher:

```sh
pnpm dev
```

From this point on, edit any file — Vue components, domain types, business logic, anything — save it, refresh the Home Assistant tab, and see your change immediately. No manual rebuild commands.

The watcher resolves all workspace packages directly from source. Vite detects changes across the entire monorepo in a single process.

---

## One-time install (no live rebuilding)

Use this path if your Home Assistant is on a separate machine or you do not intend to make code changes.

### Step 1 — Build

```sh
git clone https://github.com/eli-stone/cardinal
cd cardinal
pnpm install
pnpm build --filter @cardinal/frontend
```

The build writes to:

```
apps/integration/custom_components/cardinal/frontend/
```

### Step 2 — Copy to Home Assistant

```sh
cp -r apps/integration/custom_components/cardinal /path/to/ha-config/custom_components/
```

The result should be:

```
<ha-config>/
  custom_components/
    cardinal/
      __init__.py
      config_flow.py
      const.py
      manifest.json
      panel.py
      frontend/
        cardinal-panel.js
        assets/
          main-*.css
```

If you are running Home Assistant OS or Supervised, the config directory is `/config`. For Docker, it is wherever you mounted the config volume.

### Step 3 — Restart Home Assistant

Home Assistant must restart to discover the new custom component.

- In the UI: Settings → System → Restart
- Or restart the container / process directly

After restart, check **Settings → System → Logs** for any errors mentioning `cardinal`. A clean load produces no log output.

---

## Configuring Cardinal

### Add the integration

1. Go to **Settings → Integrations**
2. Click **+ Add Integration**
3. Search for **Cardinal**
4. Click it to open the setup form

### Map your entities

The form asks you to supply the Home Assistant entity IDs for your energy sensors.

Cardinal supports two sensor conventions for battery and grid power. Use whichever your inverter provides:

**Battery**

| Inverter type | Fields to fill |
| --- | --- |
| Separate charge / discharge sensors | `battery_charge_power` and `battery_discharge_power` |
| Single signed sensor (positive = charging, negative = discharging) | `battery_power` only |

**Grid**

| Inverter type | Fields to fill |
| --- | --- |
| Separate import / export sensors | `grid_import_power` and `grid_export_power` |
| Single signed sensor (positive = importing, negative = exporting) | `grid_power` only |

When both a combined and separate sensors are supplied, the separate sensors take precedence.

**Full field reference**

| Field | Concept | Unit |
| --- | --- | --- |
| `solar_power` | Current solar generation | W |
| `battery_power` | Net battery power (signed) | W |
| `battery_charge_power` | Battery charging rate | W |
| `battery_discharge_power` | Battery discharging rate | W |
| `battery_state_of_charge` | Battery charge level | % |
| `grid_power` | Net grid power (signed) | W |
| `grid_import_power` | Grid draw (import) | W |
| `grid_export_power` | Grid feed-in (export) | W |
| `home_consumption` | Current home load | W |
| `solar_generated_today` | Solar yield today | kWh |
| `battery_charged_today` | Battery energy in today | kWh |
| `battery_discharged_today` | Battery energy out today | kWh |
| `grid_imported_today` | Grid energy drawn today | kWh |
| `grid_exported_today` | Grid energy exported today | kWh |
| `home_consumed_today` | Home energy consumed today | kWh |
| `import_rate` | Current import tariff | £/kWh |
| `export_rate` | Current export rate | £/kWh |
| `currency` | Currency code (default: GBP) | — |

Leave unused fields blank. Only the sensors you have are required.

**Tip:** Cardinal suggests entity IDs based on sensor names and device classes. Review the suggestions — they are a best guess, not guaranteed to be correct. Verify entity IDs in **Developer Tools → States** if unsure.

### Open the panel

After saving, **Cardinal** appears in the Home Assistant sidebar. Click it. Your home's live energy state should appear within a few seconds.

---

## Applying frontend changes (dev workflow)

The `pnpm dev` watcher handles this automatically — save a file, refresh the HA tab.

In production (without the watcher):

```sh
pnpm build --filter @cardinal/frontend

# If you copied rather than symlinked:
cp -r apps/integration/custom_components/cardinal/frontend \
      /path/to/ha-config/custom_components/cardinal/
```

Then reload the browser tab. A Home Assistant restart is **not** required for frontend-only changes.

For changes to the Python integration files (`__init__.py`, `config_flow.py`, `panel.py`) you must restart Home Assistant.

---

## Reconfiguring entity mappings

1. Go to **Settings → Integrations**
2. Find **Cardinal**
3. Click the three-dot menu → **Reconfigure**

Or delete and re-add the integration to start fresh.
