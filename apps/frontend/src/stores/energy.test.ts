import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useEnergyStore } from './energy'
import type { ConfigurationHealth, DailyFinancials, DailySummary, EnergySnapshot } from '@cardinal/domain'

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

function makeFinancials(): DailyFinancials {
  return {
    date: TODAY,
    importCost: 0.28,
    exportEarnings: 0.75,
    savings: 2.20,
    currency: 'GBP',
  }
}

describe('useEnergyStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('initial state', () => {
    it('starts with no snapshot', () => {
      const store = useEnergyStore()
      expect(store.snapshot).toBeNull()
    })

    it('starts with no daily summary', () => {
      const store = useEnergyStore()
      expect(store.dailySummary).toBeNull()
    })

    it('starts with no daily financials', () => {
      const store = useEnergyStore()
      expect(store.dailyFinancials).toBeNull()
    })

    it('insight is null before the first snapshot arrives', () => {
      const store = useEnergyStore()
      expect(store.insight).toBeNull()
    })
  })

  describe('setSnapshot', () => {
    it('stores the snapshot', () => {
      const store = useEnergyStore()
      const snapshot = makeSnapshot()
      store.setSnapshot(snapshot)
      expect(store.snapshot).toEqual(snapshot)
    })

    it('derives an insight from the snapshot', () => {
      const store = useEnergyStore()
      store.setSnapshot(makeSnapshot())
      expect(store.insight).not.toBeNull()
    })

    it('insight carries the correct type for a charging-from-solar state', () => {
      const store = useEnergyStore()
      // Snapshot: solar 3000W, battery charging 1500W, no grid import
      store.setSnapshot(makeSnapshot())
      expect(store.insight?.type).toBe('battery_charging_solar')
    })

    it('insight has a non-empty description', () => {
      const store = useEnergyStore()
      store.setSnapshot(makeSnapshot())
      expect(store.insight?.description.length).toBeGreaterThan(0)
    })

    it('insight has a non-empty title', () => {
      const store = useEnergyStore()
      store.setSnapshot(makeSnapshot())
      expect(store.insight?.title.length).toBeGreaterThan(0)
    })

    it('updates the insight when a new snapshot arrives', () => {
      const store = useEnergyStore()
      store.setSnapshot(makeSnapshot())
      const firstType = store.insight?.type

      // New snapshot: no solar, importing from grid
      store.setSnapshot({
        ...makeSnapshot(),
        solar: { generatingWatts: 0, isGenerating: false },
        battery: {
          chargePercent: 50,
          chargingWatts: 0,
          dischargingWatts: 0,
          isCharging: false,
          isDischarging: false,
          isIdle: true,
        },
        grid: {
          importingWatts: 1000,
          exportingWatts: 0,
          isImporting: true,
          isExporting: false,
          isIdle: false,
        },
      })

      expect(store.insight?.type).toBe('grid_importing')
      expect(store.insight?.type).not.toBe(firstType)
    })
  })

  describe('setDailySummary', () => {
    it('stores the daily summary', () => {
      const store = useEnergyStore()
      const summary = makeDailySummary()
      store.setDailySummary(summary)
      expect(store.dailySummary).toEqual(summary)
    })
  })

  describe('setDailyFinancials', () => {
    it('stores the daily financials', () => {
      const store = useEnergyStore()
      const financials = makeFinancials()
      store.setDailyFinancials(financials)
      expect(store.dailyFinancials).toEqual(financials)
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
      store.setSnapshot(makeSnapshot())
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
