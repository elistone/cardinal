# Home Assistant Energy Model

## Purpose

Cardinal is intentionally independent of any specific Home Assistant integration.

Rather than depending on LuxPower, Solis, GivEnergy, Tesla, Victron, or another vendor, Cardinal maps Home Assistant entities onto a small set of domain concepts.

This document defines those concepts, explains how they relate to Home Assistant, and provides example entities from a real Home Assistant installation.

The example entities in this document come from a LuxPower inverter and Octopus Energy tariff integration. These are examples only—Cardinal should work with any integration capable of providing equivalent data. :contentReference[oaicite:0]{index=0}

---

# Design Principles

Cardinal should:

- understand concepts rather than integrations
- support multiple vendors
- gracefully degrade when data is unavailable
- prefer live power over calculated values
- never require every sensor to exist
- expose sensor health so users understand missing information

---

# Live Power Concepts

These sensors update frequently (typically every few seconds) and describe what the home is doing **right now**.

| Cardinal Concept | Units | Example Entity | Required |
|------------------|-------|----------------|----------|
| Solar Generation | W | `sensor.pv_power` | Recommended |
| Battery Charging Power | W | `sensor.battery_charge_power` | Optional |
| Battery Discharging Power | W | `sensor.battery_discharge_power` | Optional |
| Battery State of Charge | % | `sensor.battery_soc` | Recommended |
| Grid Import | W | `sensor.power_from_grid` | Recommended |
| Grid Export | W | `sensor.power_to_grid` | Recommended |
| Home Consumption | W | `sensor.load_power` | Recommended |

These sensors drive the **NOW** experience.

---

# Daily Energy Concepts

These sensors accumulate energy throughout the current day and normally reset at midnight.

| Cardinal Concept | Units | Example Entity |
|------------------|-------|----------------|
| Solar Generated Today | kWh | `sensor.pv_energy_today` |
| Battery Charged Today | kWh | `sensor.charge_energy_today` |
| Battery Discharged Today | kWh | `sensor.discharge_energy_today` |
| Grid Imported Today | kWh | `sensor.energy_from_grid_today` |
| Grid Exported Today | kWh | `sensor.energy_to_grid_today` |
| Home Consumed Today | kWh | `sensor.load_consumption_today` |

These sensors drive the **TODAY** experience.

---

# Financial Concepts

Cardinal can optionally calculate costs and savings when tariff information is available.

| Cardinal Concept | Units | Example Entity |
|------------------|-------|----------------|
| Import Rate | £/kWh | `sensor.octopus_energy_electricity_*_current_rate` |
| Export Rate | £/kWh | `sensor.octopus_energy_electricity_*_export_current_rate` |

Currency is configured separately.

---

# Preferred Sensor Hierarchy

Many Home Assistant integrations expose multiple ways of representing the same concept.

Cardinal should prefer sensors in this order.

## Solar Power

Preferred:

```
sensor.pv_power
```

Fallback:

```
sensor.pv1_power
sensor.pv2_power
sensor.pv3_power
...
(sum together)
```

---

## Grid Power

Preferred:

```
sensor.power_from_grid
sensor.power_to_grid
```

Fallback:

```
single signed grid power sensor
```

where:

- positive = importing
- negative = exporting

---

## Battery Power

Preferred:

```
sensor.battery_charge_power
sensor.battery_discharge_power
```

Fallback:

```
single signed battery power sensor
```

where:

- positive = charging
- negative = discharging

---

# Optional Sensors

These sensors can improve insights but are not required.

Examples include:

```
sensor.energy_flow
sensor.battery_flow
sensor.grid_flow
sensor.inverter_state
sensor.load_percentage
```

Cardinal should continue functioning without them.

---

# Sensors Outside Cardinal's Scope

Many integrations expose hundreds of engineering values.

For example:

```
sensor.grid_voltage
sensor.grid_frequency
sensor.battery_voltage
sensor.battery_temperature
sensor.internal_temperature
sensor.power_factor
sensor.active_fault_code
sensor.active_warning_code
sensor.parallel_phase
sensor.generator_voltage
```

These are valuable diagnostics but are intentionally ignored by Cardinal's core experience.

Future advanced or diagnostic views may use them.

---

# Missing Data

Cardinal is designed to work with incomplete systems.

Examples:

- Solar only
- Battery only
- Grid monitoring only
- No export meter
- No tariff integration

Unavailable sensors should produce partial insights rather than preventing the application from functioning.

---

# Sensor Health

Each mapped concept has one of four states.

| Status | Meaning |
|---------|----------|
| configured | Sensor exists and is providing valid data |
| missing | No entity has been configured |
| unavailable | Home Assistant reports unavailable or unknown |
| invalid | Entity exists but cannot be parsed into a numeric value |

Sensor health is surfaced in the UI to help users diagnose configuration issues.

---

# Current Reference Installation

The example Home Assistant installation used during development includes:

- LuxPower Modbus integration
- Solar PV
- Battery storage
- Grid import/export metering
- Octopus Energy tariff integration
- Home Assistant Energy Dashboard

It exposes over one thousand entities, but Cardinal currently requires only a small subset focused on understanding household energy flow. :contentReference[oaicite:1]{index=1}

---

# Future Integrations

Future providers should map their data onto the concepts defined in this document rather than introducing provider-specific behaviour.

The goal is for Cardinal's domain model to remain stable regardless of whether data originates from:

- LuxPower
- GivEnergy
- Victron
- Tesla Powerwall
- Solis
- Enphase
- SolarEdge
- Home Assistant statistics
- custom integrations

If equivalent concepts can be provided, Cardinal should work without modification.
