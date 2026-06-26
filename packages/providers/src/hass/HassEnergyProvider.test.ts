import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('home-assistant-js-websocket', () => ({
  subscribeEntities: vi.fn(),
}))

import { subscribeEntities } from 'home-assistant-js-websocket'
import { HassEnergyProvider } from './HassEnergyProvider'
import type { HassConnection, HassState } from './types'
import type { ConfigurationHealth, DailySummary, EnergySnapshot } from '@cardinal/domain'

function makeState(entityId: string, value: string): HassState {
  return {
    entity_id: entityId,
    state: value,
    attributes: {},
    last_changed: '2025-06-01T12:00:00Z',
    last_updated: '2025-06-01T12:00:00Z',
  }
}

function makeEntities(...entries: HassState[]): Record<string, HassState> {
  return Object.fromEntries(entries.map((s) => [s.entity_id, s]))
}

describe('HassEnergyProvider', () => {
  const mockUnsubscribe = vi.fn()
  const mockConnection = {} as HassConnection

  let triggerUpdate!: (entities: Record<string, HassState>) => void

  beforeEach(() => {
    mockUnsubscribe.mockReset()
    vi.mocked(subscribeEntities).mockImplementation((_conn, callback) => {
      triggerUpdate = callback as (entities: Record<string, HassState>) => void
      return mockUnsubscribe
    })
  })

  describe('entity subscription', () => {
    it('calls subscribeEntities with the provided connection', () => {
      new HassEnergyProvider(mockConnection, { currency: 'GBP' })
      expect(subscribeEntities).toHaveBeenCalledWith(mockConnection, expect.any(Function))
    })

    it('translates only the configured entity IDs into the snapshot', () => {
      const provider = new HassEnergyProvider(mockConnection, {
        solarPower: 'sensor.pv_power',
        batteryChargePower: 'sensor.battery_charge_power',
        batteryDischargePower: 'sensor.battery_discharge_power',
        batteryStateOfCharge: 'sensor.battery_soc',
        gridImportPower: 'sensor.power_from_grid',
        gridExportPower: 'sensor.power_to_grid',
        homeConsumption: 'sensor.load_power',
        currency: 'GBP',
      })

      let received: EnergySnapshot | null = null
      provider.onSnapshot((s) => { received = s })

      triggerUpdate(makeEntities(
        makeState('sensor.pv_power', '3600'),
        makeState('sensor.battery_charge_power', '1800'),
        makeState('sensor.battery_discharge_power', '0'),
        makeState('sensor.battery_soc', '68'),
        makeState('sensor.power_from_grid', '0'),
        makeState('sensor.power_to_grid', '800'),
        makeState('sensor.load_power', '1000'),
        makeState('sensor.unrelated', '999'),
      ))

      expect(received).not.toBeNull()
      expect(received!.solar.generatingWatts).toBe(3600)
      expect(received!.battery.chargingWatts).toBe(1800)
      expect(received!.battery.chargePercent).toBe(68)
      expect(received!.grid.exportingWatts).toBe(800)
      expect(received!.home.consumingWatts).toBe(1000)
    })

    it('excludes unconfigured entities — their values do not appear in the snapshot', () => {
      const provider = new HassEnergyProvider(mockConnection, {
        solarPower: 'sensor.pv_power',
        currency: 'GBP',
      })

      let received: EnergySnapshot | null = null
      provider.onSnapshot((s) => { received = s })

      triggerUpdate(makeEntities(
        makeState('sensor.pv_power', '2000'),
        makeState('sensor.load_power', '1500'),
      ))

      expect(received!.solar.generatingWatts).toBe(2000)
      expect(received!.home.consumingWatts).toBe(0)
    })
  })

  describe('snapshot callbacks', () => {
    it('invokes registered snapshot callbacks on entity update', () => {
      const provider = new HassEnergyProvider(mockConnection, {
        solarPower: 'sensor.pv_power',
        currency: 'GBP',
      })
      const callback = vi.fn()
      provider.onSnapshot(callback)

      triggerUpdate(makeEntities(makeState('sensor.pv_power', '1200')))

      expect(callback).toHaveBeenCalledOnce()
      expect(callback.mock.calls[0]![0].solar.generatingWatts).toBe(1200)
    })

    it('invokes multiple registered snapshot callbacks', () => {
      const provider = new HassEnergyProvider(mockConnection, { currency: 'GBP' })
      const cb1 = vi.fn()
      const cb2 = vi.fn()
      provider.onSnapshot(cb1)
      provider.onSnapshot(cb2)

      triggerUpdate({})

      expect(cb1).toHaveBeenCalledOnce()
      expect(cb2).toHaveBeenCalledOnce()
    })

    it('stops invoking a callback after its returned unsubscribe function is called', () => {
      const provider = new HassEnergyProvider(mockConnection, { currency: 'GBP' })
      const callback = vi.fn()
      const unsub = provider.onSnapshot(callback)

      unsub()
      triggerUpdate({})

      expect(callback).not.toHaveBeenCalled()
    })
  })

  describe('daily summary callbacks', () => {
    it('does not invoke summary callbacks when no daily sensors are configured', () => {
      const provider = new HassEnergyProvider(mockConnection, {
        solarPower: 'sensor.pv_power',
        currency: 'GBP',
      })
      const summaryCallback = vi.fn()
      provider.onDailySummary(summaryCallback)

      triggerUpdate(makeEntities(makeState('sensor.pv_power', '1200')))

      expect(summaryCallback).not.toHaveBeenCalled()
    })

    it('invokes summary callbacks when at least one daily sensor is configured', () => {
      const provider = new HassEnergyProvider(mockConnection, {
        solarPower: 'sensor.pv_power',
        solarGeneratedToday: 'sensor.pv_energy_today',
        currency: 'GBP',
      })
      const summaryCallback = vi.fn()
      provider.onDailySummary(summaryCallback)

      triggerUpdate(makeEntities(
        makeState('sensor.pv_power', '2000'),
        makeState('sensor.pv_energy_today', '8.4'),
      ))

      expect(summaryCallback).toHaveBeenCalledOnce()
      expect(summaryCallback.mock.calls[0]![0].solar.generatedKwh).toBeCloseTo(8.4)
    })

    it('includes all configured daily sensors in the summary', () => {
      const provider = new HassEnergyProvider(mockConnection, {
        solarGeneratedToday: 'sensor.pv_energy_today',
        gridImportedToday: 'sensor.energy_from_grid_today',
        gridExportedToday: 'sensor.energy_to_grid_today',
        homeConsumedToday: 'sensor.load_consumption_today',
        currency: 'GBP',
      })

      let received: DailySummary | null = null
      provider.onDailySummary((s) => { received = s })

      triggerUpdate(makeEntities(
        makeState('sensor.pv_energy_today', '14.2'),
        makeState('sensor.energy_from_grid_today', '1.1'),
        makeState('sensor.energy_to_grid_today', '6.5'),
        makeState('sensor.load_consumption_today', '9.8'),
      ))

      expect(received).not.toBeNull()
      expect(received!.solar.generatedKwh).toBeCloseTo(14.2)
      expect(received!.grid.importedKwh).toBeCloseTo(1.1)
      expect(received!.grid.exportedKwh).toBeCloseTo(6.5)
      expect(received!.home.consumedKwh).toBeCloseTo(9.8)
    })
  })

  describe('disconnect', () => {
    it('calls the HA unsubscribe function', () => {
      const provider = new HassEnergyProvider(mockConnection, { currency: 'GBP' })
      provider.disconnect()
      expect(mockUnsubscribe).toHaveBeenCalledOnce()
    })

    it('stops invoking snapshot callbacks after disconnect', () => {
      const provider = new HassEnergyProvider(mockConnection, {
        solarPower: 'sensor.pv_power',
        currency: 'GBP',
      })
      const callback = vi.fn()
      provider.onSnapshot(callback)

      provider.disconnect()
      triggerUpdate(makeEntities(makeState('sensor.pv_power', '1000')))

      expect(callback).not.toHaveBeenCalled()
    })

    it('stops invoking summary callbacks after disconnect', () => {
      const provider = new HassEnergyProvider(mockConnection, {
        solarGeneratedToday: 'sensor.pv_energy_today',
        currency: 'GBP',
      })
      const summaryCallback = vi.fn()
      provider.onDailySummary(summaryCallback)

      provider.disconnect()
      triggerUpdate(makeEntities(makeState('sensor.pv_energy_today', '5.0')))


      expect(summaryCallback).not.toHaveBeenCalled()
    })

    it('stops invoking health callbacks after disconnect', () => {
      const provider = new HassEnergyProvider(mockConnection, {
        solarPower: 'sensor.pv_power',
        currency: 'GBP',
      })
      const healthCallback = vi.fn()
      provider.onHealth(healthCallback)

      provider.disconnect()
      triggerUpdate(makeEntities(makeState('sensor.pv_power', '1000')))

      expect(healthCallback).not.toHaveBeenCalled()
    })
  })

  describe('health callbacks', () => {
    it('invokes health callbacks on every entity update', () => {
      const provider = new HassEnergyProvider(mockConnection, {
        solarPower: 'sensor.pv_power',
        currency: 'GBP',
      })
      const healthCallback = vi.fn()
      provider.onHealth(healthCallback)

      triggerUpdate(makeEntities(makeState('sensor.pv_power', '2000')))

      expect(healthCallback).toHaveBeenCalledOnce()
    })

    it('reports configured for a sensor that is present and healthy', () => {
      const provider = new HassEnergyProvider(mockConnection, {
        solarPower: 'sensor.pv_power',
        currency: 'GBP',
      })
      let received: ConfigurationHealth | null = null
      provider.onHealth((h) => { received = h })

      triggerUpdate(makeEntities(makeState('sensor.pv_power', '3600')))

      expect(received!.live.solar.status).toBe('configured')
      expect(received!.live.solar.entityId).toBe('sensor.pv_power')
    })

    it('reports unavailable for a configured sensor that HA marks as unavailable', () => {
      const provider = new HassEnergyProvider(mockConnection, {
        solarPower: 'sensor.pv_power',
        currency: 'GBP',
      })
      let received: ConfigurationHealth | null = null
      provider.onHealth((h) => { received = h })

      triggerUpdate(makeEntities(makeState('sensor.pv_power', 'unavailable')))

      expect(received!.live.solar.status).toBe('unavailable')
    })

    it('reports missing for concepts with no configured entity', () => {
      const provider = new HassEnergyProvider(mockConnection, { currency: 'GBP' })
      let received: ConfigurationHealth | null = null
      provider.onHealth((h) => { received = h })

      triggerUpdate({})

      expect(received!.live.solar.status).toBe('missing')
      expect(received!.daily.solarGenerated.status).toBe('missing')
    })

    it('stops invoking a health callback after its returned unsubscribe is called', () => {
      const provider = new HassEnergyProvider(mockConnection, { currency: 'GBP' })
      const healthCallback = vi.fn()
      const unsub = provider.onHealth(healthCallback)

      unsub()
      triggerUpdate({})

      expect(healthCallback).not.toHaveBeenCalled()
    })
  })
})
