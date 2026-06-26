import { describe, it, expect } from 'vitest'
import type { DailySummary } from '@cardinal/domain'
import {
  calculateImportCost,
  calculateExportEarnings,
  calculateDailySavings,
  buildDailyFinancials,
} from './energy'

const BASE_DATE = new Date('2025-06-01')

const SUMMARY: DailySummary = {
  date: BASE_DATE,
  solar: { generatedKwh: 15 },
  battery: { chargedKwh: 5, dischargedKwh: 4 },
  grid: { importedKwh: 3, exportedKwh: 8 },
  home: { consumedKwh: 12 },
}

describe('calculateImportCost', () => {
  it('multiplies imported kWh by the import rate', () => {
    expect(calculateImportCost(10, 0.28)).toBeCloseTo(2.80)
  })

  it('returns 0 when nothing was imported', () => {
    expect(calculateImportCost(0, 0.28)).toBe(0)
  })

  it('returns 0 when the rate is 0', () => {
    expect(calculateImportCost(10, 0)).toBe(0)
  })
})

describe('calculateExportEarnings', () => {
  it('multiplies exported kWh by the export rate', () => {
    expect(calculateExportEarnings(5, 0.15)).toBeCloseTo(0.75)
  })

  it('returns 0 when nothing was exported', () => {
    expect(calculateExportEarnings(0, 0.15)).toBe(0)
  })

  it('returns 0 when the rate is 0', () => {
    expect(calculateExportEarnings(5, 0)).toBe(0)
  })
})

describe('calculateDailySavings', () => {
  it('returns the difference between grid-only cost and actual cost', () => {
    // Grid-only baseline: 20 kWh × £0.28 = £5.60
    // Actual import cost: 5 kWh × £0.28 = £1.40
    // Export earnings: 3 kWh × £0.15 = £0.45
    // Actual cost: £1.40 − £0.45 = £0.95
    // Saving: £5.60 − £0.95 = £4.65
    expect(calculateDailySavings(20, 5, 3, 0.28, 0.15)).toBeCloseTo(4.65)
  })

  it('returns 0 when all consumption came from the grid with no solar or export', () => {
    expect(calculateDailySavings(20, 20, 0, 0.28, 0.15)).toBeCloseTo(0)
  })

  it('includes export earnings in the saving', () => {
    // Consumed 10 kWh, imported 0, exported 5 kWh
    // Baseline: 10 × £0.28 = £2.80
    // Actual: 0 × £0.28 − 5 × £0.15 = −£0.75
    // Saving: £2.80 − (−£0.75) = £3.55
    expect(calculateDailySavings(10, 0, 5, 0.28, 0.15)).toBeCloseTo(3.55)
  })

  it('handles a grid-only day with no solar', () => {
    expect(calculateDailySavings(10, 10, 0, 0.28, 0.15)).toBeCloseTo(0)
  })
})

describe('buildDailyFinancials', () => {
  it('calculates import cost from grid imported kWh and rate', () => {
    const financials = buildDailyFinancials(SUMMARY, 0.28, 0.15, 'GBP')
    // 3 kWh × £0.28
    expect(financials.importCost).toBeCloseTo(0.84)
  })

  it('calculates export earnings from grid exported kWh and rate', () => {
    const financials = buildDailyFinancials(SUMMARY, 0.28, 0.15, 'GBP')
    // 8 kWh × £0.15
    expect(financials.exportEarnings).toBeCloseTo(1.20)
  })

  it('calculates savings relative to a grid-only baseline', () => {
    const financials = buildDailyFinancials(SUMMARY, 0.28, 0.15, 'GBP')
    // Baseline: 12 × £0.28 = £3.36
    // Actual: £0.84 − £1.20 = −£0.36
    // Saving: £3.36 − (−£0.36) = £3.72
    expect(financials.savings).toBeCloseTo(3.72)
  })

  it('carries the date from the source summary', () => {
    const financials = buildDailyFinancials(SUMMARY, 0.28, 0.15, 'GBP')
    expect(financials.date).toEqual(BASE_DATE)
  })

  it('carries the currency code through unchanged', () => {
    const financials = buildDailyFinancials(SUMMARY, 0.28, 0.15, 'GBP')
    expect(financials.currency).toBe('GBP')
  })
})
