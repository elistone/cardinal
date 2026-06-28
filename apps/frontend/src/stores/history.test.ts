import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useEnergyStore } from './energy'
import { useHistoryStore } from './history'
import type { DailySummary, EnergySnapshot } from '@cardinal/domain'

const TIMESTAMP = new Date('2025-06-01T12:00:00Z')
const TODAY = new Date('2025-06-01')

function makeSnapshot(overrides: Partial<EnergySnapshot> = {}): EnergySnapshot {
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
    tariffs: { importRate: 0.28, exportRate: 0.15, currency: 'GBP' },
    ...overrides,
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

describe('useHistoryStore', () => {
  let energyStore: ReturnType<typeof useEnergyStore>
  let historyStore: ReturnType<typeof useHistoryStore>

  beforeEach(() => {
    setActivePinia(createPinia())
    energyStore = useEnergyStore()
    historyStore = useHistoryStore()
  })

  // ── Initial state ─────────────────────────────────────────────────────────

  describe('initial state', () => {
    it('starts in live mode', () => {
      expect(historyStore.mode).toBe('live')
    })

    it('isLive is true initially', () => {
      expect(historyStore.isLive).toBe(true)
    })

    it('currentSnapshot is null when no live snapshot has arrived', () => {
      expect(historyStore.currentSnapshot).toBeNull()
    })

    it('currentInsight is null when no live snapshot has arrived', () => {
      expect(historyStore.currentInsight).toBeNull()
    })

    it('currentDailySummary is null initially', () => {
      expect(historyStore.currentDailySummary).toBeNull()
    })

    it('currentDailyFinancials is null initially', () => {
      expect(historyStore.currentDailyFinancials).toBeNull()
    })

    it('selectedTimestamp is null initially', () => {
      expect(historyStore.selectedTimestamp).toBeNull()
    })

    it('isHistoricalAvailable is false initially', () => {
      expect(historyStore.isHistoricalAvailable).toBe(false)
    })

    it('replayState is idle initially', () => {
      expect(historyStore.replayState).toBe('idle')
    })
  })

  // ── Live mode ─────────────────────────────────────────────────────────────

  describe('live mode — currentSnapshot mirrors latestSnapshot', () => {
    it('currentSnapshot equals latestSnapshot when live', () => {
      const snapshot = makeSnapshot()
      energyStore.setLatestSnapshot(snapshot)
      expect(historyStore.currentSnapshot).toEqual(snapshot)
    })

    it('currentSnapshot updates automatically when a new live snapshot arrives', () => {
      energyStore.setLatestSnapshot(makeSnapshot())
      const updated = makeSnapshot({ solar: { generatingWatts: 0, isGenerating: false } })
      energyStore.setLatestSnapshot(updated)
      expect(historyStore.currentSnapshot?.solar.isGenerating).toBe(false)
    })

    it('currentDailySummary equals latestDailySummary when live', () => {
      const summary = makeDailySummary()
      energyStore.setLatestDailySummary(summary)
      expect(historyStore.currentDailySummary).toEqual(summary)
    })
  })

  // ── Insight derivation ────────────────────────────────────────────────────

  describe('currentInsight', () => {
    it('derives an insight once a live snapshot arrives', () => {
      energyStore.setLatestSnapshot(makeSnapshot())
      expect(historyStore.currentInsight).not.toBeNull()
    })

    it('insight type is correct for a battery-charging-from-solar state', () => {
      energyStore.setLatestSnapshot(makeSnapshot())
      expect(historyStore.currentInsight?.type).toBe('battery_charging_solar')
    })

    it('insight has a non-empty title', () => {
      energyStore.setLatestSnapshot(makeSnapshot())
      expect(historyStore.currentInsight?.title.length).toBeGreaterThan(0)
    })

    it('insight has a non-empty description', () => {
      energyStore.setLatestSnapshot(makeSnapshot())
      expect(historyStore.currentInsight?.description.length).toBeGreaterThan(0)
    })

    it('insight updates when the live snapshot changes', () => {
      energyStore.setLatestSnapshot(makeSnapshot())
      const firstType = historyStore.currentInsight?.type

      energyStore.setLatestSnapshot(makeSnapshot({
        solar: { generatingWatts: 0, isGenerating: false },
        battery: { chargePercent: 50, chargingWatts: 0, dischargingWatts: 0, isCharging: false, isDischarging: false, isIdle: true },
        grid: { importingWatts: 1000, exportingWatts: 0, isImporting: true, isExporting: false, isIdle: false },
      }))

      expect(historyStore.currentInsight?.type).toBe('grid_importing')
      expect(historyStore.currentInsight?.type).not.toBe(firstType)
    })
  })

  // ── Daily financials derivation ───────────────────────────────────────────

  describe('currentDailyFinancials', () => {
    it('is null before any daily summary arrives', () => {
      expect(historyStore.currentDailyFinancials).toBeNull()
    })

    it('is null when summary exists but tariffs are not configured', () => {
      energyStore.setLatestDailySummary(makeDailySummary())
      energyStore.setLatestSnapshot(makeSnapshot({
        tariffs: { importRate: null, exportRate: null, currency: 'GBP' },
      }))
      expect(historyStore.currentDailyFinancials).toBeNull()
    })

    it('derives financials when both summary and tariff rates are available', () => {
      energyStore.setLatestDailySummary(makeDailySummary())
      energyStore.setLatestSnapshot(makeSnapshot({
        tariffs: { importRate: 0.28, exportRate: 0.15, currency: 'GBP' },
      }))
      const f = historyStore.currentDailyFinancials
      expect(f).not.toBeNull()
      // importedKwh=1 × 0.28 = 0.28
      expect(f?.importCost).toBeCloseTo(0.28)
      // exportedKwh=5 × 0.15 = 0.75
      expect(f?.exportEarnings).toBeCloseTo(0.75)
      expect(f?.currency).toBe('GBP')
    })

    it('updates automatically when tariff rates become available', () => {
      energyStore.setLatestDailySummary(makeDailySummary())
      expect(historyStore.currentDailyFinancials).toBeNull()

      energyStore.setLatestSnapshot(makeSnapshot({
        tariffs: { importRate: 0.28, exportRate: 0.15, currency: 'GBP' },
      }))
      expect(historyStore.currentDailyFinancials).not.toBeNull()
    })
  })

  // ── currentTime ───────────────────────────────────────────────────────────

  describe('currentTime', () => {
    it('is null when no live snapshot has arrived', () => {
      expect(historyStore.currentTime).toBeNull()
    })

    it('equals the live snapshot timestamp in live mode', () => {
      energyStore.setLatestSnapshot(makeSnapshot())
      expect(historyStore.currentTime).toEqual(TIMESTAMP)
    })
  })

  // ── Historical mode ───────────────────────────────────────────────────────

  describe('enterHistoricalMode / exitHistoricalMode', () => {
    it('sets mode to historical', () => {
      historyStore.enterHistoricalMode(new Date('2025-06-01T10:00:00Z'))
      expect(historyStore.mode).toBe('historical')
    })

    it('sets selectedTimestamp to the requested time', () => {
      const t = new Date('2025-06-01T10:00:00Z')
      historyStore.enterHistoricalMode(t)
      expect(historyStore.selectedTimestamp).toEqual(t)
    })

    it('clears currentSnapshot immediately on entering historical mode', () => {
      energyStore.setLatestSnapshot(makeSnapshot())
      historyStore.enterHistoricalMode(new Date('2025-06-01T10:00:00Z'))
      // currentSnapshot is null until setHistoricalSnapshot() is called
      expect(historyStore.currentSnapshot).toBeNull()
    })

    it('isLive is false in historical mode', () => {
      historyStore.enterHistoricalMode(new Date('2025-06-01T10:00:00Z'))
      expect(historyStore.isLive).toBe(false)
    })

    it('exits historical mode and restores live snapshot', () => {
      const liveSnapshot = makeSnapshot()
      energyStore.setLatestSnapshot(liveSnapshot)

      historyStore.enterHistoricalMode(new Date('2025-06-01T10:00:00Z'))
      historyStore.setHistoricalSnapshot(makeSnapshot({ solar: { generatingWatts: 100, isGenerating: true } }))

      historyStore.exitHistoricalMode()

      expect(historyStore.mode).toBe('live')
      expect(historyStore.currentSnapshot).toEqual(liveSnapshot)
    })

    it('clears selectedTimestamp on exit', () => {
      historyStore.enterHistoricalMode(new Date('2025-06-01T10:00:00Z'))
      historyStore.exitHistoricalMode()
      expect(historyStore.selectedTimestamp).toBeNull()
    })
  })

  // ── setHistoricalSnapshot ─────────────────────────────────────────────────

  describe('setHistoricalSnapshot', () => {
    it('sets currentSnapshot to the provided historical snapshot', () => {
      historyStore.enterHistoricalMode(new Date('2025-06-01T10:00:00Z'))
      const historical = makeSnapshot({ solar: { generatingWatts: 800, isGenerating: true } })
      historyStore.setHistoricalSnapshot(historical)
      expect(historyStore.currentSnapshot).toEqual(historical)
    })

    it('derives insight from the historical snapshot', () => {
      historyStore.enterHistoricalMode(new Date('2025-06-01T10:00:00Z'))
      historyStore.setHistoricalSnapshot(makeSnapshot())
      expect(historyStore.currentInsight?.type).toBe('battery_charging_solar')
    })

    it('sets historicalDailySummary when provided', () => {
      historyStore.enterHistoricalMode(new Date('2025-06-01T10:00:00Z'))
      const summary = makeDailySummary()
      historyStore.setHistoricalSnapshot(makeSnapshot(), summary)
      expect(historyStore.currentDailySummary).toEqual(summary)
    })

    it('does not change currentDailySummary when dailySummary is omitted', () => {
      historyStore.enterHistoricalMode(new Date('2025-06-01T10:00:00Z'))
      historyStore.setHistoricalSnapshot(makeSnapshot())
      expect(historyStore.currentDailySummary).toBeNull()
    })

    it('uses historical tariff rates for financial calculation', () => {
      historyStore.enterHistoricalMode(new Date('2025-06-01T10:00:00Z'))
      const historicalSnapshot = makeSnapshot({
        tariffs: { importRate: 0.10, exportRate: 0.05, currency: 'GBP' },
      })
      historyStore.setHistoricalSnapshot(historicalSnapshot, makeDailySummary())

      const f = historyStore.currentDailyFinancials
      expect(f).not.toBeNull()
      // importedKwh=1 × 0.10 = 0.10
      expect(f?.importCost).toBeCloseTo(0.10)
      // exportedKwh=5 × 0.05 = 0.25
      expect(f?.exportEarnings).toBeCloseTo(0.25)
    })
  })

  // ── setSelectedTimestamp ──────────────────────────────────────────────────

  describe('setSelectedTimestamp', () => {
    it('updates selectedTimestamp', () => {
      const t = new Date('2025-06-01T15:00:00Z')
      historyStore.enterHistoricalMode(t)
      const t2 = new Date('2025-06-01T16:00:00Z')
      historyStore.setSelectedTimestamp(t2)
      expect(historyStore.selectedTimestamp).toEqual(t2)
    })
  })

  // ── Historical mode currentTime ───────────────────────────────────────────

  describe('currentTime in historical mode', () => {
    it('equals selectedTimestamp when in historical mode', () => {
      const t = new Date('2025-06-01T14:36:22Z')
      historyStore.enterHistoricalMode(t)
      expect(historyStore.currentTime).toEqual(t)
    })
  })

  // ── Live mode does not see historical data ────────────────────────────────

  describe('live mode isolation from historical data', () => {
    it('live snapshot is unaffected by entering and exiting historical mode', () => {
      const liveSnapshot = makeSnapshot()
      energyStore.setLatestSnapshot(liveSnapshot)

      historyStore.enterHistoricalMode(new Date('2025-06-01T10:00:00Z'))
      historyStore.setHistoricalSnapshot(makeSnapshot({ solar: { generatingWatts: 0, isGenerating: false } }))
      historyStore.exitHistoricalMode()

      expect(historyStore.currentSnapshot).toEqual(liveSnapshot)
    })
  })
})
