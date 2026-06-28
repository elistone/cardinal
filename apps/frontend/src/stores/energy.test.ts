import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useEnergyStore } from './energy'
import type { ConfigurationHealth, DailySummary, EnergySnapshot } from '@cardinal/domain'

const TIMESTAMP = new Date('2025-06-01T12:00:00Z')
const TODAY = new Date('2025-06-01')

function makeSnapshot(): EnergySnapshot {
  return {
    timestamp: TIMESTAMP,
    solar: { generatingWatts: 3000, isGenerating: true },
    battery: {
      chargePercent: 70,
      chargingWatts: 1500,
      dischargingWatts: 0,
      isCharging: true,
      isDischarging: false,
      isIdle: false,
    },
    grid: {
      importingWatts: 0,
      exportingWatts: 500,
      isImporting: false,
      isExporting: true,
      isIdle: false,
    },
    home: { consumingWatts: 1000 },
    tariffs: { importRate: null, exportRate: null, currency: 'GBP' },
  }
}

function makeDailySummary(): DailySummary {
  return {
    date: TODAY,
    solar: { generatedKwh: 12 },
    battery: { chargedKwh: 4, dischargedKwh: 2 },
    grid: { importedKwh: 1, exportedKwh: 5 },
    home: { consumedKwh: 10 },
  }
}

describe('useEnergyStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('initial state', () => {
    it('starts with no latest snapshot', () => {
      const store = useEnergyStore()
      expect(store.latestSnapshot).toBeNull()
    })

    it('starts with no latest daily summary', () => {
      const store = useEnergyStore()
      expect(store.latestDailySummary).toBeNull()
    })
  })

  describe('setLatestSnapshot', () => {
    it('stores the snapshot as latestSnapshot', () => {
      const store = useEnergyStore()
      const snapshot = makeSnapshot()
      store.setLatestSnapshot(snapshot)
      expect(store.latestSnapshot).toEqual(snapshot)
    })

    it('updates latestSnapshot when called again', () => {
      const store = useEnergyStore()
      store.setLatestSnapshot(makeSnapshot())

      const updated = { ...makeSnapshot(), solar: { generatingWatts: 0, isGenerating: false } }
      store.setLatestSnapshot(updated)

      expect(store.latestSnapshot?.solar.isGenerating).toBe(false)
    })
  })

  describe('setLatestDailySummary', () => {
    it('stores the daily summary as latestDailySummary', () => {
      const store = useEnergyStore()
      const summary = makeDailySummary()
      store.setLatestDailySummary(summary)
      expect(store.latestDailySummary).toEqual(summary)
    })
  })

  describe('connectionStatus and derived flags', () => {
    it('starts in connecting status', () => {
      const store = useEnergyStore()
      expect(store.connectionStatus).toBe('connecting')
    })

    it('isLoading is true when connecting and no snapshot', () => {
      const store = useEnergyStore()
      expect(store.isLoading).toBe(true)
    })

    it('isLoading is false once a snapshot arrives', () => {
      const store = useEnergyStore()
      store.setLatestSnapshot(makeSnapshot())
      expect(store.isLoading).toBe(false)
    })

    it('isLoading is false when connected even without a snapshot', () => {
      const store = useEnergyStore()
      store.setConnectionStatus('connected')
      expect(store.isLoading).toBe(false)
    })

    it('isDisconnected is false initially', () => {
      const store = useEnergyStore()
      expect(store.isDisconnected).toBe(false)
    })

    it('isDisconnected is true after setConnectionStatus("disconnected")', () => {
      const store = useEnergyStore()
      store.setConnectionStatus('disconnected')
      expect(store.isDisconnected).toBe(true)
    })

    it('isConfigured is null before health is received', () => {
      const store = useEnergyStore()
      expect(store.isConfigured).toBeNull()
    })

    it('isConfigured is false when all live sensors are missing', () => {
      const store = useEnergyStore()
      const missing = { status: 'missing' as const }
      store.setHealth({
        live: {
          solar: missing,
          batteryCharging: missing,
          batteryDischarging: missing,
          batteryLevel: missing,
          gridImport: missing,
          gridExport: missing,
          homeConsumption: missing,
        },
        daily: {
          solarGenerated: missing,
          batteryCharged: missing,
          batteryDischarged: missing,
          gridImported: missing,
          gridExported: missing,
          homeConsumed: missing,
        },
      })
      expect(store.isConfigured).toBe(false)
    })

    it('isConfigured is true when at least one live sensor is configured', () => {
      const store = useEnergyStore()
      const configured = { status: 'configured' as const, entityId: 'sensor.pv_power' }
      const missing = { status: 'missing' as const }
      store.setHealth({
        live: {
          solar: configured,
          batteryCharging: missing,
          batteryDischarging: missing,
          batteryLevel: missing,
          gridImport: missing,
          gridExport: missing,
          homeConsumption: missing,
        },
        daily: {
          solarGenerated: missing,
          batteryCharged: missing,
          batteryDischarged: missing,
          gridImported: missing,
          gridExported: missing,
          homeConsumed: missing,
        },
      })
      expect(store.isConfigured).toBe(true)
    })
  })

  describe('health', () => {
    function makeHealth(): ConfigurationHealth {
      const configured = { status: 'configured' as const, entityId: 'sensor.pv_power' }
      const missing = { status: 'missing' as const }
      return {
        live: {
          solar: configured,
          batteryCharging: configured,
          batteryDischarging: configured,
          batteryLevel: configured,
          gridImport: configured,
          gridExport: configured,
          homeConsumption: configured,
        },
        daily: {
          solarGenerated: missing,
          batteryCharged: missing,
          batteryDischarged: missing,
          gridImported: missing,
          gridExported: missing,
          homeConsumed: missing,
        },
      }
    }

    it('starts with no health', () => {
      const store = useEnergyStore()
      expect(store.health).toBeNull()
    })

    it('stores health when setHealth is called', () => {
      const store = useEnergyStore()
      const health = makeHealth()
      store.setHealth(health)
      expect(store.health).toEqual(health)
    })

    it('reflects the live solar status from the health model', () => {
      const store = useEnergyStore()
      store.setHealth(makeHealth())
      expect(store.health?.live.solar.status).toBe('configured')
    })

    it('reflects missing status for unconfigured daily sensors', () => {
      const store = useEnergyStore()
      store.setHealth(makeHealth())
      expect(store.health?.daily.solarGenerated.status).toBe('missing')
    })
  })
})
