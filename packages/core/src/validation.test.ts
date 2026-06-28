import { describe, it, expect } from 'vitest'
import { validateSnapshot } from './validation'
import type { EnergySnapshot } from '@cardinal/domain'

function makeValid(): EnergySnapshot {
  return {
    timestamp: new Date('2025-06-01T12:00:00Z'),
    solar:   { generatingWatts: 2000, isGenerating: true },
    battery: { chargePercent: 70, chargingWatts: 800, dischargingWatts: 0, isCharging: true, isDischarging: false, isIdle: false },
    grid:    { importingWatts: 0, exportingWatts: 200, isImporting: false, isExporting: true, isIdle: false },
    home:    { consumingWatts: 1000 },
    tariffs: { importRate: 0.245, exportRate: 0.15, currency: 'GBP' },
  }
}

describe('validateSnapshot', () => {
  it('accepts a valid live snapshot', () => {
    expect(validateSnapshot(makeValid()).valid).toBe(true)
  })

  it('accepts a valid historical snapshot — same invariants apply', () => {
    const historical = { ...makeValid(), timestamp: new Date('2024-01-15T08:30:00Z') }
    expect(validateSnapshot(historical).valid).toBe(true)
  })

  it('accepts a snapshot with all zero watts (overnight idle)', () => {
    const idle: EnergySnapshot = {
      timestamp: new Date('2025-06-01T02:00:00Z'),
      solar:   { generatingWatts: 0, isGenerating: false },
      battery: { chargePercent: 42, chargingWatts: 0, dischargingWatts: 0, isCharging: false, isDischarging: false, isIdle: true },
      grid:    { importingWatts: 450, exportingWatts: 0, isImporting: true, isExporting: false, isIdle: false },
      home:    { consumingWatts: 450 },
      tariffs: { importRate: null, exportRate: null, currency: 'GBP' },
    }
    expect(validateSnapshot(idle).valid).toBe(true)
  })

  it('rejects an invalid timestamp', () => {
    const snap = { ...makeValid(), timestamp: new Date('not-a-date') }
    const result = validateSnapshot(snap)
    expect(result.valid).toBe(false)
    expect(result.warnings.some(w => w.includes('timestamp'))).toBe(true)
  })

  it('rejects negative solar watts', () => {
    const snap = { ...makeValid(), solar: { generatingWatts: -100, isGenerating: false } }
    const result = validateSnapshot(snap)
    expect(result.valid).toBe(false)
    expect(result.warnings.some(w => w.includes('solar.generatingWatts'))).toBe(true)
  })

  it('rejects NaN solar watts', () => {
    const snap = { ...makeValid(), solar: { generatingWatts: NaN, isGenerating: false } }
    expect(validateSnapshot(snap).valid).toBe(false)
  })

  it('rejects battery chargePercent above 100', () => {
    const snap = {
      ...makeValid(),
      battery: { ...makeValid().battery, chargePercent: 101 },
    }
    const result = validateSnapshot(snap)
    expect(result.valid).toBe(false)
    expect(result.warnings.some(w => w.includes('chargePercent'))).toBe(true)
  })

  it('rejects battery chargePercent below 0', () => {
    const snap = {
      ...makeValid(),
      battery: { ...makeValid().battery, chargePercent: -1 },
    }
    expect(validateSnapshot(snap).valid).toBe(false)
  })

  it('rejects simultaneous battery charging and discharging', () => {
    const snap = {
      ...makeValid(),
      battery: {
        chargePercent: 50,
        chargingWatts: 500,
        dischargingWatts: 500,
        isCharging: true,
        isDischarging: true,
        isIdle: false,
      },
    }
    const result = validateSnapshot(snap)
    expect(result.valid).toBe(false)
    expect(result.warnings.some(w => w.includes('charging and discharging'))).toBe(true)
  })

  it('rejects simultaneous grid import and export', () => {
    const snap = {
      ...makeValid(),
      grid: {
        importingWatts: 500,
        exportingWatts: 500,
        isImporting: true,
        isExporting: true,
        isIdle: false,
      },
    }
    const result = validateSnapshot(snap)
    expect(result.valid).toBe(false)
    expect(result.warnings.some(w => w.includes('importing and exporting'))).toBe(true)
  })

  it('rejects negative home consumption', () => {
    const snap = { ...makeValid(), home: { consumingWatts: -50 } }
    const result = validateSnapshot(snap)
    expect(result.valid).toBe(false)
    expect(result.warnings.some(w => w.includes('home.consumingWatts'))).toBe(true)
  })

  it('returns multiple warnings when multiple invariants are violated', () => {
    const snap: EnergySnapshot = {
      timestamp: new Date('bad'),
      solar:   { generatingWatts: -1, isGenerating: false },
      battery: { chargePercent: 200, chargingWatts: 0, dischargingWatts: 0, isCharging: false, isDischarging: false, isIdle: true },
      grid:    { importingWatts: 0, exportingWatts: 0, isImporting: false, isExporting: false, isIdle: true },
      home:    { consumingWatts: 0 },
      tariffs: { importRate: null, exportRate: null, currency: 'GBP' },
    }
    const result = validateSnapshot(snap)
    expect(result.warnings.length).toBeGreaterThan(2)
  })
})
