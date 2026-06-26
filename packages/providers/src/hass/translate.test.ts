import { describe, it, expect } from 'vitest'
import { translateDailySummary, translateEnergySnapshot } from './translate'
import type { HassState } from './types'

function state(entityId: string, value: string): HassState {
  return {
    entity_id: entityId,
    state: value,
    attributes: {},
    last_changed: '2025-06-01T12:00:00Z',
    last_updated: '2025-06-01T12:00:00Z',
  }
}

function states(...entries: HassState[]): Record<string, HassState> {
  return Object.fromEntries(entries.map((s) => [s.entity_id, s]))
}

describe('translateEnergySnapshot — solar', () => {
  it('reads generating watts from the configured entity', () => {
    const snapshot = translateEnergySnapshot(
      states(state('sensor.pv_power', '2450.5')),
      { solarPower: 'sensor.pv_power' },
    )
    expect(snapshot.solar.generatingWatts).toBeCloseTo(2450.5)
    expect(snapshot.solar.isGenerating).toBe(true)
  })

  it('returns zero when the solar entity is unavailable', () => {
    const snapshot = translateEnergySnapshot(
      states(state('sensor.pv_power', 'unavailable')),
      { solarPower: 'sensor.pv_power' },
    )
    expect(snapshot.solar.generatingWatts).toBe(0)
    expect(snapshot.solar.isGenerating).toBe(false)
  })

  it('clamps negative solar readings to zero', () => {
    const snapshot = translateEnergySnapshot(
      states(state('sensor.pv_power', '-100')),
      { solarPower: 'sensor.pv_power' },
    )
    expect(snapshot.solar.generatingWatts).toBe(0)
    expect(snapshot.solar.isGenerating).toBe(false)
  })

  it('returns zero when no solar entity is configured', () => {
    const snapshot = translateEnergySnapshot(states(), {})
    expect(snapshot.solar.generatingWatts).toBe(0)
    expect(snapshot.solar.isGenerating).toBe(false)
  })
})

describe('translateEnergySnapshot — battery via separate sensors', () => {
  it('reads charging state from separate charge and discharge sensors', () => {
    const snapshot = translateEnergySnapshot(
      states(
        state('sensor.battery_charge_power', '2000'),
        state('sensor.battery_discharge_power', '0'),
        state('sensor.battery_soc', '75'),
      ),
      {
        batteryChargePower: 'sensor.battery_charge_power',
        batteryDischargePower: 'sensor.battery_discharge_power',
        batteryStateOfCharge: 'sensor.battery_soc',
      },
    )
    expect(snapshot.battery.chargingWatts).toBe(2000)
    expect(snapshot.battery.dischargingWatts).toBe(0)
    expect(snapshot.battery.isCharging).toBe(true)
    expect(snapshot.battery.isDischarging).toBe(false)
    expect(snapshot.battery.isIdle).toBe(false)
    expect(snapshot.battery.chargePercent).toBe(75)
  })

  it('reads discharging state from separate sensors', () => {
    const snapshot = translateEnergySnapshot(
      states(
        state('sensor.battery_charge_power', '0'),
        state('sensor.battery_discharge_power', '1500'),
        state('sensor.battery_soc', '60'),
      ),
      {
        batteryChargePower: 'sensor.battery_charge_power',
        batteryDischargePower: 'sensor.battery_discharge_power',
        batteryStateOfCharge: 'sensor.battery_soc',
      },
    )
    expect(snapshot.battery.chargingWatts).toBe(0)
    expect(snapshot.battery.dischargingWatts).toBe(1500)
    expect(snapshot.battery.isCharging).toBe(false)
    expect(snapshot.battery.isDischarging).toBe(true)
    expect(snapshot.battery.isIdle).toBe(false)
  })

  it('reports idle when both separate sensors read zero', () => {
    const snapshot = translateEnergySnapshot(
      states(
        state('sensor.battery_charge_power', '0'),
        state('sensor.battery_discharge_power', '0'),
        state('sensor.battery_soc', '100'),
      ),
      {
        batteryChargePower: 'sensor.battery_charge_power',
        batteryDischargePower: 'sensor.battery_discharge_power',
        batteryStateOfCharge: 'sensor.battery_soc',
      },
    )
    expect(snapshot.battery.isIdle).toBe(true)
    expect(snapshot.battery.chargePercent).toBe(100)
  })

  it('clamps SOC above 100 to 100', () => {
    const snapshot = translateEnergySnapshot(
      states(state('sensor.battery_soc', '105')),
      { batteryStateOfCharge: 'sensor.battery_soc' },
    )
    expect(snapshot.battery.chargePercent).toBe(100)
  })

  it('clamps SOC below 0 to 0', () => {
    const snapshot = translateEnergySnapshot(
      states(state('sensor.battery_soc', '-5')),
      { batteryStateOfCharge: 'sensor.battery_soc' },
    )
    expect(snapshot.battery.chargePercent).toBe(0)
  })

  it('returns zero SOC when SOC entity is unavailable', () => {
    const snapshot = translateEnergySnapshot(
      states(state('sensor.battery_soc', 'unavailable')),
      { batteryStateOfCharge: 'sensor.battery_soc' },
    )
    expect(snapshot.battery.chargePercent).toBe(0)
  })
})

describe('translateEnergySnapshot — battery via single signed sensor', () => {
  it('treats positive values as charging', () => {
    const snapshot = translateEnergySnapshot(
      states(state('sensor.battery_power', '2000')),
      { batteryPower: 'sensor.battery_power' },
    )
    expect(snapshot.battery.chargingWatts).toBe(2000)
    expect(snapshot.battery.dischargingWatts).toBe(0)
    expect(snapshot.battery.isCharging).toBe(true)
  })

  it('treats negative values as discharging', () => {
    const snapshot = translateEnergySnapshot(
      states(state('sensor.battery_power', '-1500')),
      { batteryPower: 'sensor.battery_power' },
    )
    expect(snapshot.battery.chargingWatts).toBe(0)
    expect(snapshot.battery.dischargingWatts).toBe(1500)
    expect(snapshot.battery.isDischarging).toBe(true)
  })

  it('reports idle when the single sensor reads zero', () => {
    const snapshot = translateEnergySnapshot(
      states(state('sensor.battery_power', '0')),
      { batteryPower: 'sensor.battery_power' },
    )
    expect(snapshot.battery.isIdle).toBe(true)
  })
})

describe('translateEnergySnapshot — grid via separate sensors', () => {
  it('reads import power from the import sensor', () => {
    const snapshot = translateEnergySnapshot(
      states(
        state('sensor.power_from_grid', '500'),
        state('sensor.power_to_grid', '0'),
      ),
      {
        gridImportPower: 'sensor.power_from_grid',
        gridExportPower: 'sensor.power_to_grid',
      },
    )
    expect(snapshot.grid.importingWatts).toBe(500)
    expect(snapshot.grid.exportingWatts).toBe(0)
    expect(snapshot.grid.isImporting).toBe(true)
    expect(snapshot.grid.isExporting).toBe(false)
    expect(snapshot.grid.isIdle).toBe(false)
  })

  it('reads export power from the export sensor', () => {
    const snapshot = translateEnergySnapshot(
      states(
        state('sensor.power_from_grid', '0'),
        state('sensor.power_to_grid', '3000'),
      ),
      {
        gridImportPower: 'sensor.power_from_grid',
        gridExportPower: 'sensor.power_to_grid',
      },
    )
    expect(snapshot.grid.importingWatts).toBe(0)
    expect(snapshot.grid.exportingWatts).toBe(3000)
    expect(snapshot.grid.isExporting).toBe(true)
  })

  it('reports idle when both separate grid sensors read zero', () => {
    const snapshot = translateEnergySnapshot(
      states(
        state('sensor.power_from_grid', '0'),
        state('sensor.power_to_grid', '0'),
      ),
      {
        gridImportPower: 'sensor.power_from_grid',
        gridExportPower: 'sensor.power_to_grid',
      },
    )
    expect(snapshot.grid.isIdle).toBe(true)
  })

  it('handles unavailable grid sensors gracefully', () => {
    const snapshot = translateEnergySnapshot(
      states(
        state('sensor.power_from_grid', 'unavailable'),
        state('sensor.power_to_grid', 'unavailable'),
      ),
      {
        gridImportPower: 'sensor.power_from_grid',
        gridExportPower: 'sensor.power_to_grid',
      },
    )
    expect(snapshot.grid.importingWatts).toBe(0)
    expect(snapshot.grid.exportingWatts).toBe(0)
    expect(snapshot.grid.isIdle).toBe(true)
  })
})

describe('translateEnergySnapshot — grid via single signed sensor', () => {
  it('treats positive values as importing', () => {
    const snapshot = translateEnergySnapshot(
      states(state('sensor.grid_power', '800')),
      { gridPower: 'sensor.grid_power' },
    )
    expect(snapshot.grid.importingWatts).toBe(800)
    expect(snapshot.grid.isImporting).toBe(true)
  })

  it('treats negative values as exporting', () => {
    const snapshot = translateEnergySnapshot(
      states(state('sensor.grid_power', '-2000')),
      { gridPower: 'sensor.grid_power' },
    )
    expect(snapshot.grid.exportingWatts).toBe(2000)
    expect(snapshot.grid.isExporting).toBe(true)
  })
})

describe('translateEnergySnapshot — home consumption', () => {
  it('reads the configured load sensor', () => {
    const snapshot = translateEnergySnapshot(
      states(state('sensor.load_power', '3200')),
      { homeConsumption: 'sensor.load_power' },
    )
    expect(snapshot.home.consumingWatts).toBe(3200)
  })

  it('returns zero when the load sensor is unavailable', () => {
    const snapshot = translateEnergySnapshot(
      states(state('sensor.load_power', 'unknown')),
      { homeConsumption: 'sensor.load_power' },
    )
    expect(snapshot.home.consumingWatts).toBe(0)
  })

  it('clamps negative load readings to zero', () => {
    const snapshot = translateEnergySnapshot(
      states(state('sensor.load_power', '-50')),
      { homeConsumption: 'sensor.load_power' },
    )
    expect(snapshot.home.consumingWatts).toBe(0)
  })
})

describe('translateEnergySnapshot — full LuxPower mapping', () => {
  it('translates a complete real-world snapshot using LuxPower entity IDs', () => {
    const snapshot = translateEnergySnapshot(
      states(
        state('sensor.pv_power', '3600'),
        state('sensor.battery_charge_power', '1800'),
        state('sensor.battery_discharge_power', '0'),
        state('sensor.battery_soc', '68'),
        state('sensor.power_from_grid', '0'),
        state('sensor.power_to_grid', '800'),
        state('sensor.load_power', '1000'),
      ),
      {
        solarPower: 'sensor.pv_power',
        batteryChargePower: 'sensor.battery_charge_power',
        batteryDischargePower: 'sensor.battery_discharge_power',
        batteryStateOfCharge: 'sensor.battery_soc',
        gridImportPower: 'sensor.power_from_grid',
        gridExportPower: 'sensor.power_to_grid',
        homeConsumption: 'sensor.load_power',
      },
    )

    expect(snapshot.solar.generatingWatts).toBe(3600)
    expect(snapshot.solar.isGenerating).toBe(true)
    expect(snapshot.battery.chargingWatts).toBe(1800)
    expect(snapshot.battery.chargePercent).toBe(68)
    expect(snapshot.battery.isCharging).toBe(true)
    expect(snapshot.grid.exportingWatts).toBe(800)
    expect(snapshot.grid.isExporting).toBe(true)
    expect(snapshot.grid.isImporting).toBe(false)
    expect(snapshot.home.consumingWatts).toBe(1000)
  })
})

describe('translateEnergySnapshot — empty mapping', () => {
  it('returns a fully zeroed snapshot when no entities are configured', () => {
    const snapshot = translateEnergySnapshot(states(), {})

    expect(snapshot.solar.generatingWatts).toBe(0)
    expect(snapshot.battery.chargingWatts).toBe(0)
    expect(snapshot.battery.dischargingWatts).toBe(0)
    expect(snapshot.battery.chargePercent).toBe(0)
    expect(snapshot.battery.isIdle).toBe(true)
    expect(snapshot.grid.importingWatts).toBe(0)
    expect(snapshot.grid.exportingWatts).toBe(0)
    expect(snapshot.grid.isIdle).toBe(true)
    expect(snapshot.home.consumingWatts).toBe(0)
  })
})

describe('translateDailySummary — full mapping', () => {
  it('reads kWh values from all daily energy sensors', () => {
    const summary = translateDailySummary(
      states(
        state('sensor.pv_energy_today', '12.4'),
        state('sensor.charge_energy_today', '5.2'),
        state('sensor.discharge_energy_today', '3.1'),
        state('sensor.energy_from_grid_today', '1.0'),
        state('sensor.energy_to_grid_today', '8.7'),
        state('sensor.load_consumption_today', '9.3'),
      ),
      {
        solarGeneratedToday: 'sensor.pv_energy_today',
        batteryChargedToday: 'sensor.charge_energy_today',
        batteryDischargedToday: 'sensor.discharge_energy_today',
        gridImportedToday: 'sensor.energy_from_grid_today',
        gridExportedToday: 'sensor.energy_to_grid_today',
        homeConsumedToday: 'sensor.load_consumption_today',
      },
    )

    expect(summary.solar.generatedKwh).toBeCloseTo(12.4)
    expect(summary.battery.chargedKwh).toBeCloseTo(5.2)
    expect(summary.battery.dischargedKwh).toBeCloseTo(3.1)
    expect(summary.grid.importedKwh).toBeCloseTo(1.0)
    expect(summary.grid.exportedKwh).toBeCloseTo(8.7)
    expect(summary.home.consumedKwh).toBeCloseTo(9.3)
  })

  it('sets date to today at local midnight', () => {
    const summary = translateDailySummary(states(), {})
    const expected = new Date()
    expected.setHours(0, 0, 0, 0)
    expect(summary.date.getFullYear()).toBe(expected.getFullYear())
    expect(summary.date.getMonth()).toBe(expected.getMonth())
    expect(summary.date.getDate()).toBe(expected.getDate())
    expect(summary.date.getHours()).toBe(0)
    expect(summary.date.getMinutes()).toBe(0)
    expect(summary.date.getSeconds()).toBe(0)
  })
})

describe('translateDailySummary — missing and unconfigured sensors', () => {
  it('returns zero for all fields when no sensors are configured', () => {
    const summary = translateDailySummary(states(), {})
    expect(summary.solar.generatedKwh).toBe(0)
    expect(summary.battery.chargedKwh).toBe(0)
    expect(summary.battery.dischargedKwh).toBe(0)
    expect(summary.grid.importedKwh).toBe(0)
    expect(summary.grid.exportedKwh).toBe(0)
    expect(summary.home.consumedKwh).toBe(0)
  })

  it('returns zero for a sensor that is configured but absent from states', () => {
    const summary = translateDailySummary(states(), {
      solarGeneratedToday: 'sensor.pv_energy_today',
    })
    expect(summary.solar.generatedKwh).toBe(0)
  })

  it('returns zero for an unavailable sensor', () => {
    const summary = translateDailySummary(
      states(state('sensor.pv_energy_today', 'unavailable')),
      { solarGeneratedToday: 'sensor.pv_energy_today' },
    )
    expect(summary.solar.generatedKwh).toBe(0)
  })

  it('returns zero for an unknown sensor', () => {
    const summary = translateDailySummary(
      states(state('sensor.pv_energy_today', 'unknown')),
      { solarGeneratedToday: 'sensor.pv_energy_today' },
    )
    expect(summary.solar.generatedKwh).toBe(0)
  })

  it('clamps negative kWh readings to zero', () => {
    const summary = translateDailySummary(
      states(state('sensor.pv_energy_today', '-1.5')),
      { solarGeneratedToday: 'sensor.pv_energy_today' },
    )
    expect(summary.solar.generatedKwh).toBe(0)
  })

  it('returns only configured fields; unconfigured fields remain zero', () => {
    const summary = translateDailySummary(
      states(
        state('sensor.pv_energy_today', '7.2'),
        state('sensor.energy_from_grid_today', '1.4'),
      ),
      {
        solarGeneratedToday: 'sensor.pv_energy_today',
        gridImportedToday: 'sensor.energy_from_grid_today',
      },
    )
    expect(summary.solar.generatedKwh).toBeCloseTo(7.2)
    expect(summary.grid.importedKwh).toBeCloseTo(1.4)
    expect(summary.battery.chargedKwh).toBe(0)
    expect(summary.battery.dischargedKwh).toBe(0)
    expect(summary.grid.exportedKwh).toBe(0)
    expect(summary.home.consumedKwh).toBe(0)
  })
})
