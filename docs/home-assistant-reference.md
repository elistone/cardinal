# Home Assistant Development Reference

> This document describes the Home Assistant installation used during the development of Cardinal.

It exists to provide a consistent reference implementation for contributors and AI assistants.

This is **not** intended to represent every Home Assistant installation. It documents the environment Cardinal is initially developed and tested against.

---

# Home Assistant

| Property         | Value              |
| ---------------- | ------------------ |
| Platform         | Home Assistant     |
| Runtime          | Home Assistant OS  |
| Integration Type | Custom Integration |
| Frontend         | Custom Panel       |

---

# Energy System

## Inverter

LuxPower LXP 3.6K

Connected using the LuxPower Modbus integration.

---

## Solar

Photovoltaic solar array connected to the LuxPower inverter.

Cardinal receives all production data via the inverter.

---

## Battery

| Property        | Value          |
| --------------- | -------------- |
| Capacity        | 6.4 kWh        |
| Charging        | Solar + Grid   |
| Night Charging  | Enabled        |
| Off-Peak Tariff | Octopus Energy |

The battery is intentionally charged overnight during cheap-rate electricity.

This means Cardinal must distinguish between:

* Solar charging
* Grid charging
* Battery discharge

These are different user stories and should be presented differently.

---

## Energy Supplier

Octopus Energy

Used for:

* Electricity import pricing
* Export pricing
* Standing charge
* Cost calculations

---

# Home Assistant Integrations

Current integrations include:

* LuxPower Modbus
* Octopus Energy
* Forecast.Solar
* Home Assistant Energy Dashboard

Cardinal should integrate with these where appropriate but remain provider-driven so additional systems can be supported in future.

---

# Entity Conventions

## LuxPower Modbus

The reference installation uses a LuxPower inverter via the LuxPower Modbus integration.

This integration exposes **separate** sensors for battery charging and discharging, and for grid import and export. It does not use a single signed sensor.

| Concept | Convention | Notes |
|---|---|---|
| Battery charging | `sensor.battery_charge_power` (W, always ≥ 0) | Separate from discharge |
| Battery discharging | `sensor.battery_discharge_power` (W, always ≥ 0) | Separate from charge |
| Grid import | `sensor.power_from_grid` (W, always ≥ 0) | Separate from export |
| Grid export | `sensor.power_to_grid` (W, always ≥ 0) | Separate from import |

Cardinal's provider layer translates these into its internal domain model. `BatteryState.power.watts` is stored as net watts (positive = charging). `GridState` uses boolean flags (`isImporting`, `isExporting`) alongside an absolute magnitude.

## Octopus Energy

Octopus Energy entity IDs include meter and MPAN numbers, making them unique per installation:

```
sensor.octopus_energy_electricity_{serial}_{mpan}_current_rate
sensor.octopus_energy_electricity_{serial}_{mpan}_current_standing_charge
sensor.octopus_energy_electricity_{serial}_{mpan_export}_export_current_rate
```

During Config Flow setup, these are pre-populated using keyword matching (`current_rate`, `export_rate`). Users confirm the correct entity for their meter.

---

# Development Philosophy

During development, Cardinal should use real Home Assistant entities wherever possible.

Avoid inventing example entity IDs if an equivalent development entity already exists.

If an entity cannot be found, contributors should ask before introducing a placeholder.

---

# Current Development Goals

Cardinal v1 focuses on answering:

> What is happening in my home right now?

and

> What has happened today?

Everything else is considered future scope.

---

# Notes

This document is a living reference.

Whenever the development Home Assistant installation changes, this document should be updated accordingly.
