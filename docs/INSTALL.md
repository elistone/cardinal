# Installing Cardinal

Cardinal is a Home Assistant custom integration that adds an energy explanation panel to your sidebar.

This guide covers installation from a local checkout.

---

## Prerequisites

- Home Assistant 2024.1 or later
- Node.js 20 or later
- pnpm 9 or later
- A Home Assistant installation you can copy files into (local, VM, or container with volume access)

---

## Step 1 — Build the frontend

Clone the repository and build the frontend bundle.

```sh
git clone https://github.com/eli-stone/cardinal
cd cardinal
pnpm install
pnpm build --filter @cardinal/frontend
```

The build outputs a single JavaScript file to:

```
apps/integration/custom_components/cardinal/frontend/cardinal-panel.js
```

---

## Step 2 — Copy the integration

Copy the `cardinal` custom component directory into your Home Assistant `custom_components` folder.

```sh
cp -r apps/integration/custom_components/cardinal /path/to/homeassistant/custom_components/
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

If you are running Home Assistant OS or Supervised, the config directory is usually `/config`. If you are running it via Docker, it is wherever you mounted the config volume.

### Using a symlink (faster iteration)

If you are actively developing Cardinal and your Home Assistant config is on the same machine, use a symlink instead of copying:

```sh
ln -s /path/to/cardinal/apps/integration/custom_components/cardinal \
      /path/to/homeassistant/custom_components/cardinal
```

After each `pnpm build --filter @cardinal/frontend` the panel updates immediately — no copy needed.

---

## Step 3 — Restart Home Assistant

Home Assistant must be restarted to discover the new custom component.

- In the UI: Settings → System → Restart
- Or restart the process / container directly

After restart, check **Settings → System → Logs** for any errors about `cardinal`. A clean load produces no errors.

---

## Step 4 — Add the integration

1. Go to **Settings → Integrations**
2. Click **+ Add Integration**
3. Search for **Cardinal**
4. Click it to open the configuration form

---

## Step 5 — Map your entities

The configuration form asks you to map your Home Assistant sensor entity IDs to Cardinal concepts.

Cardinal supports two conventions for battery and grid power sensors. Use whichever matches your inverter:

### Battery power

| Your inverter type | Fields to fill |
| --- | --- |
| Separate charge / discharge sensors | `battery_charge_power` and `battery_discharge_power` |
| Single signed sensor (positive = charging, negative = discharging) | `battery_power` only |

If both are provided, the separate sensors take precedence.

### Grid power

| Your inverter type | Fields to fill |
| --- | --- |
| Separate import / export sensors | `grid_import_power` and `grid_export_power` |
| Single signed sensor (positive = importing, negative = exporting) | `grid_power` only |

If both are provided, the separate sensors take precedence.

### Field reference

| Field | Cardinal concept | Unit |
| --- | --- | --- |
| `solar_power` | Current solar generation | W |
| `battery_power` | Net battery power (signed) | W |
| `battery_charge_power` | Battery charging power | W |
| `battery_discharge_power` | Battery discharging power | W |
| `battery_state_of_charge` | Battery charge level | % |
| `grid_power` | Net grid power (signed) | W |
| `grid_import_power` | Grid import (draw from grid) | W |
| `grid_export_power` | Grid export (feed to grid) | W |
| `home_consumption` | Current home load | W |
| `solar_generated_today` | Solar energy produced today | kWh |
| `battery_charged_today` | Battery energy charged today | kWh |
| `battery_discharged_today` | Battery energy discharged today | kWh |
| `grid_imported_today` | Grid energy imported today | kWh |
| `grid_exported_today` | Grid energy exported today | kWh |
| `home_consumed_today` | Home energy consumed today | kWh |
| `import_rate` | Current electricity import rate | £/kWh |
| `export_rate` | Current electricity export rate | £/kWh |
| `currency` | Currency symbol | — |

Only the sensors you have are required. Leave unused fields blank.

**Tip:** Cardinal will auto-suggest entity IDs based on your sensor names and device classes. Review the suggestions before saving — they are a best guess, not guaranteed to be correct.

---

## Step 6 — Open the panel

After saving the configuration, **Cardinal** appears in the Home Assistant sidebar.

Click it. You should see your home's live energy state within a few seconds.

---

## Rebuilding after code changes

After any code change to the frontend, rebuild and (if you are not using a symlink) re-copy:

```sh
pnpm build --filter @cardinal/frontend

# If copying rather than symlinking:
cp -r apps/integration/custom_components/cardinal/frontend \
      /path/to/homeassistant/custom_components/cardinal/
```

Then reload the browser tab. A full Home Assistant restart is not required for frontend-only changes.

For changes to the Python integration (`__init__.py`, `config_flow.py`, `panel.py`) you must restart Home Assistant.

---

## Reconfiguring entity mappings

To change entity mappings after initial setup:

1. Go to **Settings → Integrations**
2. Find **Cardinal**
3. Click the three-dot menu → **Reconfigure** (or **Delete** and re-add to start fresh)
