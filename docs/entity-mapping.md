# Entity Mapping

> This document maps Cardinal concepts to the Home Assistant entities used during development.

Providers should consume this mapping rather than relying on hardcoded entity IDs.

---

# Solar

| Cardinal Concept   | Home Assistant Entity    |
| ------------------ | ------------------------ |
| Solar Power        | `sensor.pv_power`        |
| Solar Energy Today | `sensor.pv_energy_today` |
| Solar Energy Total | `sensor.pv_energy_total` |

---

# Battery

| Cardinal Concept          | Home Assistant Entity            |
| ------------------------- | -------------------------------- |
| Battery State of Charge   | `sensor.battery_soc`             |
| Battery Health            | `sensor.battery_soh`             |
| Battery Voltage           | `sensor.battery_voltage`         |
| Battery Temperature       | `sensor.battery_temperature`     |
| Battery Charging Power    | `sensor.battery_charge_power`    |
| Battery Discharging Power | `sensor.battery_discharge_power` |
| Battery Charge Today      | `sensor.charge_energy_today`     |
| Battery Discharge Today   | `sensor.discharge_energy_today`  |

---

# Grid

| Cardinal Concept  | Home Assistant Entity           |
| ----------------- | ------------------------------- |
| Grid Import Power | `sensor.power_from_grid`        |
| Grid Export Power | `sensor.power_to_grid`          |
| Grid Import Today | `sensor.energy_from_grid_today` |
| Grid Export Today | `sensor.energy_to_grid_today`   |
| Grid Voltage      | `sensor.grid_voltage`           |
| Grid Frequency    | `sensor.grid_frequency`         |

---

# Home Consumption

| Cardinal Concept    | Home Assistant Entity           |
| ------------------- | ------------------------------- |
| Current Load        | `sensor.load_power`             |
| Today's Consumption | `sensor.load_consumption_today` |
| Load Percentage     | `sensor.load_percentage`        |

---

# Energy Flow

| Cardinal Concept | Home Assistant Entity |
| ---------------- | --------------------- |
| Energy Flow      | `sensor.energy_flow`  |
| Battery Flow     | `sensor.battery_flow` |
| Grid Flow        | `sensor.grid_flow`    |

These sensors are intended to drive the live energy flow visualisation.

---

# Inverter

| Cardinal Concept     | Home Assistant Entity         |
| -------------------- | ----------------------------- |
| Inverter State       | `sensor.inverter_state`       |
| Inverter Power       | `sensor.inverter_power`       |
| Internal Temperature | `sensor.internal_temperature` |

---

# Octopus Energy

| Cardinal Concept        | Home Assistant Entity                                                                  |
| ----------------------- | -------------------------------------------------------------------------------------- |
| Current Import Rate     | `sensor.octopus_energy_electricity_21s0035573_1414658291001_current_rate`              |
| Current Standing Charge | `sensor.octopus_energy_electricity_21s0035573_1414658291001_current_standing_charge`   |
| Current Import Cost     | `sensor.octopus_energy_electricity_21s0035573_1414658291001_current_accumulative_cost` |
| Export Rate             | `sensor.octopus_energy_electricity_21s0035573_1470001621102_export_current_rate`       |

---

# Forecast

| Cardinal Concept          | Home Assistant Entity               |
| ------------------------- | ----------------------------------- |
| Solar Production Today    | `sensor.energy_production_today`    |
| Solar Production Tomorrow | `sensor.energy_production_tomorrow` |
| Current Solar Forecast    | `sensor.power_production_now`       |

These entities are out of scope for v1 but should remain documented for future forecasting features.

---

# Required v1 Entities

The following entities are considered mandatory for the first release of Cardinal:

* `sensor.pv_power`
* `sensor.pv_energy_today`
* `sensor.battery_soc`
* `sensor.battery_charge_power`
* `sensor.battery_discharge_power`
* `sensor.power_from_grid`
* `sensor.power_to_grid`
* `sensor.energy_from_grid_today`
* `sensor.energy_to_grid_today`
* `sensor.load_power`
* `sensor.load_consumption_today`

If any required entity cannot be mapped during setup, Cardinal should clearly inform the user and guide them through the mapping process.

---

# Notes

This mapping represents the reference Home Assistant installation used during development.

Other integrations (FoxESS, GivEnergy, SolarEdge, etc.) will provide different entity IDs. Providers are responsible for translating those into the same Cardinal domain concepts.
