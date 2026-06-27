# Installing Cardinal

Cardinal is a custom integration for Home Assistant. It adds an energy explanation panel to your sidebar that shows what your home is doing with power right now — in plain English.

This guide explains how to install it from a release file. No technical knowledge is required beyond basic familiarity with Home Assistant.

---

## What you need

- Home Assistant 2024.1 or later
- Access to your Home Assistant config directory (explained below)
- The Cardinal release file — download the latest `cardinal-x.x.x.zip` from the [Releases page](https://github.com/eli-stone/cardinal/releases)

---

## Step 1 — Find your config directory

The config directory is where Home Assistant stores its settings. It contains files like `configuration.yaml`. You need to be able to place files inside it.

How you access it depends on how you installed Home Assistant:

### Home Assistant OS (the most common install)

Your config directory lives inside the HA system and is not directly accessible from your computer's file browser by default. The easiest way to access it is through the **Samba share add-on** or the **SSH & Web Terminal add-on**, both available in the Add-on Store.

**Samba share (recommended for non-technical users)**

1. Go to **Settings → Add-ons → Add-on Store**
2. Search for **Samba share** and install it
3. Start it and enable "Start on boot"
4. Your config directory will appear as a network share called `config` on your local network — accessible from Windows Explorer or macOS Finder

**SSH & Web Terminal**

1. Install and start the **SSH & Web Terminal** add-on
2. Connect via SSH — the config directory is at `/config`

### Home Assistant Supervised or Core

Your config directory is on the machine running HA. Its location depends on how you set it up — commonly `/etc/homeassistant` or whichever path you specified with `--config`.

### Docker

Your config directory is wherever you mounted the `/config` volume in your `docker run` command or `compose.yml`.

---

## Step 2 — Create the custom_components folder

Inside your config directory, create a folder called `custom_components` if it does not already exist. Inside that, create a folder called `cardinal`.

The result should be:

```
config/
  custom_components/
    cardinal/          ← create this
  configuration.yaml
  ...
```

If `custom_components` already exists (because you have other custom integrations), just create the `cardinal` folder inside it.

---

## Step 3 — Extract the release file

Extract the `cardinal-x.x.x.zip` file you downloaded. Inside it you will find:

```
custom_components/
  cardinal/
    __init__.py
    config_flow.py
    const.py
    manifest.json
    panel.py
    frontend/
      ...
```

Copy the contents of the `cardinal` folder from the ZIP into the `cardinal` folder you created in Step 2.

When you are done, your config directory should look like this:

```
config/
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

---

## Step 4 — Restart Home Assistant

Home Assistant needs to restart to discover the new integration.

Go to **Settings → System → Restart** and confirm.

Wait for Home Assistant to come back online before continuing.

---

## Step 5 — Add the Cardinal integration

1. Go to **Settings → Integrations**
2. Click **+ Add Integration** (bottom right)
3. Type **Cardinal** in the search box
4. Click the Cardinal result

If Cardinal does not appear in the search, the files were not placed correctly. See [Troubleshooting](#troubleshooting) below.

---

## Step 6 — Configure Cardinal

Cardinal walks you through a short three-step setup to connect your sensors. You select sensors from a picker — no entity IDs to type.

### Step 1 of 3 — Live power sensors

Cardinal pre-selects sensors based on your inverter integration. Review the suggestions and correct any that look wrong.

**For battery and grid**, your inverter may expose sensors in one of two ways:

- **Single signed sensor** — one reading that is positive when charging (or importing) and negative when discharging (or exporting). Common on SolarEdge, SMA, and some Deye systems.
- **Separate sensors** — one reading for charge rate and another for discharge rate. Common on LuxPower, GivEnergy, FoxESS, and Solis systems.

Fill in the fields that match your setup. If you are unsure, check your inverter's integration page in **Settings → Devices & Services**.

| Sensor | What it measures | Unit |
| --- | --- | --- |
| Solar power | Current solar generation | W |
| Battery power (signed) | Net battery — positive = charging | W |
| Battery charge power | Charging rate only | W |
| Battery discharge power | Discharging rate only | W |
| Battery state of charge | Current battery level | % |
| Grid power (signed) | Net grid — positive = importing | W |
| Grid import power | Power drawn from the grid | W |
| Grid export power | Power sent to the grid | W |
| Home consumption | Total current home load | W |

All fields are optional — leave blank for hardware you do not have.

### Step 2 of 3 — Daily energy sensors

These sensors report energy totals (in kWh) that reset each midnight. Cardinal uses them to build the daily summary. If you skip this step, Cardinal shows live data only.

| Sensor | What it measures |
| --- | --- |
| Solar generated today | Solar energy produced since midnight |
| Battery charged today | Energy stored in battery since midnight |
| Battery discharged today | Energy taken from battery since midnight |
| Grid imported today | Energy drawn from grid since midnight |
| Grid exported today | Energy sent to grid since midnight |
| Home consumed today | Energy used by home since midnight |

### Step 3 of 3 — Tariffs (optional)

Connect your tariff sensors to show cost and savings. For Octopus Energy users, select the "current rate" sensor from the Octopus Energy integration.

| Sensor | What it measures |
| --- | --- |
| Import rate | Current price per kWh for electricity drawn from the grid |
| Export rate | Current price per kWh for electricity sent to the grid |
| Currency | Currency for cost display (e.g. GBP, EUR, USD) |

### If your sensors do not appear in the pickers

The sensor pickers filter by device class — a property that well-configured inverter integrations set automatically. If your sensors are missing:

1. Go to **Settings → Devices & Services** and find your inverter integration
2. Check that the sensors list their unit of measurement and device class correctly
3. If they do not, the integration may need updating, or you can set the device class manually via **Developer Tools → States** → the sensor → Edit

Cardinal's health overlay (visible from the panel) will show which sensors are missing or unavailable after setup.

---

## Step 7 — Open the panel

After saving the configuration, **Cardinal** appears in your Home Assistant sidebar.

Click it. Within a few seconds you should see your home's live energy state.

---

## Updating Cardinal

When a new version is released:

1. Download the new `cardinal-x.x.x.zip` from the [Releases page](https://github.com/eli-stone/cardinal/releases)
2. Extract it and copy the contents into `custom_components/cardinal/`, replacing the existing files
3. Restart Home Assistant

You do not need to reconfigure your entity mappings — they are stored by Home Assistant and persist across updates.

---

## Reconfiguring entity mappings

If you need to change which sensors are mapped:

1. Go to **Settings → Integrations**
2. Find **Cardinal** in the list
3. Click the three-dot menu (⋮) → **Reconfigure**

---

## Troubleshooting

### Cardinal does not appear in the integration search

The files were not found by Home Assistant. Check:

- The folder is named exactly `cardinal` (lowercase) inside `custom_components`
- The folder contains `manifest.json`
- Home Assistant was restarted after placing the files

Check **Settings → System → Logs** and search for `cardinal` — any errors will appear there.

### "Set up Cardinal" appears even after configuring sensors

Every sensor field was left blank, or none of the entity IDs you entered exist in Home Assistant. Go to **Settings → Integrations → Cardinal → Reconfigure** and check your entity IDs against **Developer Tools → States**.

### Values look wrong or do not update

The most common causes:

| Symptom | Likely cause |
| --- | --- |
| Solar always shows 0 | Wrong entity ID, or sensor unit is kW not W |
| Battery always shows idle | Your inverter uses a single signed sensor — use the "Battery power" field instead of separate charge/discharge fields |
| Grid import and export are swapped | The separate import and export entity IDs are in the wrong fields |
| Values are 1000× too large | Sensor reports in kW — Cardinal expects W |

### "Reconnecting" banner appears

Cardinal lost its connection to Home Assistant. This happens during HA restarts or brief network interruptions. It reconnects automatically — wait a moment, and if it does not resolve, reload the browser tab.

### Sensor shows "Unavailable" in the health overlay

The sensor exists in HA but is currently reporting `unavailable`. This means the hardware or the inverter integration is offline, not Cardinal. Check the sensor in **Developer Tools → States** and restart your inverter integration if needed.

For more detailed troubleshooting, see [TROUBLESHOOTING.md](TROUBLESHOOTING.md).
