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

Cardinal needs to know which Home Assistant sensors represent your solar, battery, and grid data. You map them by entering their entity IDs into the setup form.

### Finding entity IDs

Entity IDs look like `sensor.solar_power` or `sensor.battery_soc`. To find yours:

1. Go to **Developer Tools → States** in your HA sidebar
2. Use the search box to filter by keywords like "solar", "battery", "grid", or your inverter's name
3. Find the sensor that matches and copy its entity ID from the left column

### What to fill in

The form has the following fields. Leave any field blank if you do not have that sensor.

**Solar**

| Field | What it measures | Unit |
| --- | --- | --- |
| Solar power | Current solar generation | W |
| Solar generated today | Solar energy produced today | kWh |

**Battery**

Cardinal supports two different ways inverters report battery power. Use whichever matches yours:

- **Separate sensors** — one sensor for charging power, one for discharging power. Common with inverters like LuxPower, GivEnergy, and FoxESS.
- **Single signed sensor** — one sensor that is positive when charging and negative when discharging. Common with SolarEdge and some other systems.

Fill in the fields that match your setup. If you fill in both, the separate sensors take priority.

| Field | What it measures | Unit |
| --- | --- | --- |
| Battery power | Net battery power — positive = charging, negative = discharging | W |
| Battery charge power | Charging rate only | W |
| Battery discharge power | Discharging rate only | W |
| Battery state of charge | Current charge level | % |
| Battery charged today | Energy stored in battery today | kWh |
| Battery discharged today | Energy taken from battery today | kWh |

**Grid**

The same two-convention choice applies to grid sensors:

- **Separate sensors** — one for import power (drawing from the grid) and one for export power (sending to the grid).
- **Single signed sensor** — one sensor that is positive when importing and negative when exporting.

| Field | What it measures | Unit |
| --- | --- | --- |
| Grid power | Net grid power — positive = importing, negative = exporting | W |
| Grid import power | Power drawn from the grid | W |
| Grid export power | Power sent to the grid | W |
| Grid imported today | Energy drawn from the grid today | kWh |
| Grid exported today | Energy sent to the grid today | kWh |

**Home**

| Field | What it measures | Unit |
| --- | --- | --- |
| Home consumption | Current total home load | W |
| Home consumed today | Total energy used by the home today | kWh |

**Rates (optional)**

| Field | What it measures |
| --- | --- |
| Import rate | Current electricity import price per kWh |
| Export rate | Current electricity export price per kWh |
| Currency | Currency code, e.g. `GBP` or `EUR` |

### Tips

- Cardinal will suggest entity IDs based on your sensor names. Review them before saving — they may not always be correct.
- You do not need every sensor. Fill in what you have. Unconfigured sensors will appear as "Missing" in the health overlay but will not stop the panel from working.
- Cardinal expects power in **watts (W)** and energy in **kilowatt-hours (kWh)**. Some inverter integrations report in kilowatts — if Cardinal shows values that look 1000× too large or too small, check the `unit_of_measurement` in Developer Tools → States.

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
