import { describe, it, expect } from 'vitest'
import { assessConfigurationHealth } from './health'
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

const LUXPOWER_MAPPING = {
  solarPower: 'sensor.pv_power',
  batteryChargePower: 'sensor.battery_charge_power',
  batteryDischargePower: 'sensor.battery_discharge_power',
  batteryStateOfCharge: 'sensor.battery_soc',
  gridImportPower: 'sensor.power_from_grid',
  gridExportPower: 'sensor.power_to_grid',
  homeConsumption: 'sensor.load_power',
  solarGeneratedToday: 'sensor.pv_energy_today',
  batteryChargedToday: 'sensor.charge_energy_today',
  batteryDischargedToday: 'sensor.discharge_energy_today',
  gridImportedToday: 'sensor.energy_from_grid_today',
  gridExportedToday: 'sensor.energy_to_grid_today',
  homeConsumedToday: 'sensor.load_consumption_today',
  currency: 'GBP',
}

const LUXPOWER_LIVE_STATES = states(
  state('sensor.pv_power', '3600'),
  state('sensor.battery_charge_power', '1800'),
  state('sensor.battery_discharge_power', '0'),
  state('sensor.battery_soc', '68'),
  state('sensor.power_from_grid', '0'),
  state('sensor.power_to_grid', '800'),
  state('sensor.load_power', '1000'),
)

const LUXPOWER_DAILY_STATES = states(
  state('sensor.pv_energy_today', '12.4'),
  state('sensor.charge_energy_today', '5.2'),
  state('sensor.discharge_energy_today', '3.1'),
  state('sensor.energy_from_grid_today', '1.0'),
  state('sensor.energy_to_grid_today', '8.7'),
  state('sensor.load_consumption_today', '9.3'),
)

describe('assessConfigurationHealth — sensor status values', () => {
  it('returns configured when the entity is present and has a valid numeric state', () => {
    const health = assessConfigurationHealth(
      states(state('sensor.pv_power', '3600')),
      { solarPower: 'sensor.pv_power', currency: 'GBP' },
    )
    expect(health.live.solar.status).toBe('configured')
    expect(health.live.solar.entityId).toBe('sensor.pv_power')
  })

  it('returns configured for a zero reading (idle sensor)', () => {
    const health = assessConfigurationHealth(
      states(state('sensor.pv_power', '0')),
      { solarPower: 'sensor.pv_power', currency: 'GBP' },
    )
    expect(health.live.solar.status).toBe('configured')
  })

  it('returns missing when no entity ID is configured for a concept', () => {
    const health = assessConfigurationHealth(states(), { currency: 'GBP' })
    expect(health.live.solar.status).toBe('missing')
    expect(health.live.solar.entityId).toBeUndefined()
  })

  it('returns unavailable when the entity is absent from states', () => {
    const health = assessConfigurationHealth(
      states(),
      { solarPower: 'sensor.pv_power', currency: 'GBP' },
    )
    expect(health.live.solar.status).toBe('unavailable')
    expect(health.live.solar.entityId).toBe('sensor.pv_power')
  })

  it('returns unavailable when HA reports the entity as unavailable', () => {
    const health = assessConfigurationHealth(
      states(state('sensor.pv_power', 'unavailable')),
      { solarPower: 'sensor.pv_power', currency: 'GBP' },
    )
    expect(health.live.solar.status).toBe('unavailable')
    expect(health.live.solar.entityId).toBe('sensor.pv_power')
  })

  it('returns unavailable when HA reports the entity as unknown', () => {
    const health = assessConfigurationHealth(
      states(state('sensor.pv_power', 'unknown')),
      { solarPower: 'sensor.pv_power', currency: 'GBP' },
    )
    expect(health.live.solar.status).toBe('unavailable')
  })

  it('returns invalid when the entity has a non-numeric state that is not a known HA status', () => {
    const health = assessConfigurationHealth(
      states(state('sensor.pv_power', 'error')),
      { solarPower: 'sensor.pv_power', currency: 'GBP' },
    )
    expect(health.live.solar.status).toBe('invalid')
    expect(health.live.solar.entityId).toBe('sensor.pv_power')
  })
})

describe('assessConfigurationHealth — dual-convention sensors', () => {
  it('uses the separate charge sensor when batteryChargePower is configured', () => {
    const health = assessConfigurationHealth(
      states(
        state('sensor.battery_charge_power', '1800'),
        state('sensor.battery_power', '1800'),
      ),
      {
        batteryChargePower: 'sensor.battery_charge_power',
        batteryPower: 'sensor.battery_power',
        currency: 'GBP',
      },
    )
    expect(health.live.batteryCharging.status).toBe('configured')
    expect(health.live.batteryCharging.entityId).toBe('sensor.battery_charge_power')
  })

  it('falls back to the signed battery sensor when separate sensors are not configured', () => {
    const health = assessConfigurationHealth(
      states(state('sensor.battery_power', '1800')),
      { batteryPower: 'sensor.battery_power', currency: 'GBP' },
    )
    expect(health.live.batteryCharging.status).toBe('configured')
    expect(health.live.batteryCharging.entityId).toBe('sensor.battery_power')
    expect(health.live.batteryDischarging.status).toBe('configured')
    expect(health.live.batteryDischarging.entityId).toBe('sensor.battery_power')
  })

  it('returns missing for batteryCharging when neither convention is configured', () => {
    const health = assessConfigurationHealth(states(), { currency: 'GBP' })
    expect(health.live.batteryCharging.status).toBe('missing')
    expect(health.live.batteryDischarging.status).toBe('missing')
  })

  it('uses the separate grid import sensor when gridImportPower is configured', () => {
    const health = assessConfigurationHealth(
      states(state('sensor.power_from_grid', '500')),
      { gridImportPower: 'sensor.power_from_grid', currency: 'GBP' },
    )
    expect(health.live.gridImport.status).toBe('configured')
    expect(health.live.gridImport.entityId).toBe('sensor.power_from_grid')
  })

  it('falls back to the signed grid sensor for both import and export', () => {
    const health = assessConfigurationHealth(
      states(state('sensor.grid_power', '500')),
      { gridPower: 'sensor.grid_power', currency: 'GBP' },
    )
    expect(health.live.gridImport.entityId).toBe('sensor.grid_power')
    expect(health.live.gridExport.entityId).toBe('sensor.grid_power')
  })
})

describe('assessConfigurationHealth — full LuxPower mapping', () => {
  it('reports all live concepts as configured when all sensors are present and healthy', () => {
    const health = assessConfigurationHealth(LUXPOWER_LIVE_STATES, LUXPOWER_MAPPING)

    expect(health.live.solar.status).toBe('configured')
    expect(health.live.batteryCharging.status).toBe('configured')
    expect(health.live.batteryDischarging.status).toBe('configured')
    expect(health.live.batteryLevel.status).toBe('configured')
    expect(health.live.gridImport.status).toBe('configured')
    expect(health.live.gridExport.status).toBe('configured')
    expect(health.live.homeConsumption.status).toBe('configured')
  })

  it('reports all daily concepts as configured when all daily sensors are present', () => {
    const health = assessConfigurationHealth(
      { ...LUXPOWER_LIVE_STATES, ...LUXPOWER_DAILY_STATES },
      LUXPOWER_MAPPING,
    )

    expect(health.daily.solarGenerated.status).toBe('configured')
    expect(health.daily.batteryCharged.status).toBe('configured')
    expect(health.daily.batteryDischarged.status).toBe('configured')
    expect(health.daily.gridImported.status).toBe('configured')
    expect(health.daily.gridExported.status).toBe('configured')
    expect(health.daily.homeConsumed.status).toBe('configured')
  })
})

describe('assessConfigurationHealth — daily sensors', () => {
  it('returns missing for all daily concepts when no daily sensors are configured', () => {
    const health = assessConfigurationHealth(states(), { currency: 'GBP' })

    expect(health.daily.solarGenerated.status).toBe('missing')
    expect(health.daily.batteryCharged.status).toBe('missing')
    expect(health.daily.batteryDischarged.status).toBe('missing')
    expect(health.daily.gridImported.status).toBe('missing')
    expect(health.daily.gridExported.status).toBe('missing')
    expect(health.daily.homeConsumed.status).toBe('missing')
  })

  it('returns unavailable for a daily sensor that HA reports as unavailable', () => {
    const health = assessConfigurationHealth(
      states(state('sensor.pv_energy_today', 'unavailable')),
      { solarGeneratedToday: 'sensor.pv_energy_today', currency: 'GBP' },
    )
    expect(health.daily.solarGenerated.status).toBe('unavailable')
    expect(health.daily.solarGenerated.entityId).toBe('sensor.pv_energy_today')
  })

  it('reports mixed status when only some daily sensors are configured', () => {
    const health = assessConfigurationHealth(
      states(state('sensor.pv_energy_today', '8.4')),
      {
        solarGeneratedToday: 'sensor.pv_energy_today',
        currency: 'GBP',
      },
    )
    expect(health.daily.solarGenerated.status).toBe('configured')
    expect(health.daily.gridImported.status).toBe('missing')
  })
})
