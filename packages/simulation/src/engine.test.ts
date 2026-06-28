import { describe, it, expect } from 'vitest'
import { buildDay } from './engine.js'
import { validateSnapshot } from '@cardinal/core'
import {
  SUNNY_SUMMER_DAY,
  CLOUDY_DAY,
  WINTER_DAY,
  STORM_NO_SOLAR,
  HEAVY_EVENING,
  EV_CHARGING_OVERNIGHT,
  BATTERY_CHARGING_THEN_EXPORTING,
  ALL_SCENARIOS,
} from './scenarios.js'

const REFERENCE_DATE = new Date(2026, 5, 27)  // 27 June 2026

// ─── Point count and timestamps ───────────────────────────────────────────────

describe('buildDay — structure', () => {
  it('produces exactly 1440 points (one per minute)', () => {
    const day = buildDay(SUNNY_SUMMER_DAY, REFERENCE_DATE)
    expect(day.points).toHaveLength(1440)
  })

  it('first point is at local midnight', () => {
    const day = buildDay(SUNNY_SUMMER_DAY, REFERENCE_DATE)
    const first = day.points[0]!.timestamp
    expect(first.getHours()).toBe(0)
    expect(first.getMinutes()).toBe(0)
    expect(first.getSeconds()).toBe(0)
  })

  it('last point is at 23:59', () => {
    const day = buildDay(SUNNY_SUMMER_DAY, REFERENCE_DATE)
    const last = day.points[1439]!.timestamp
    expect(last.getHours()).toBe(23)
    expect(last.getMinutes()).toBe(59)
  })

  it('consecutive points are exactly 1 minute apart', () => {
    const day = buildDay(SUNNY_SUMMER_DAY, REFERENCE_DATE)
    const diff = day.points[1]!.timestamp.getTime() - day.points[0]!.timestamp.getTime()
    expect(diff).toBe(60_000)
  })

  it('exposes the scenario and date', () => {
    const day = buildDay(SUNNY_SUMMER_DAY, REFERENCE_DATE)
    expect(day.scenario).toBe(SUNNY_SUMMER_DAY)
    expect(day.date.getFullYear()).toBe(2026)
    expect(day.date.getMonth()).toBe(5)
    expect(day.date.getDate()).toBe(27)
  })
})

// ─── Snapshot validity ────────────────────────────────────────────────────────

describe('buildDay — snapshot validity', () => {
  it('all snapshots in a sunny day pass validateSnapshot()', () => {
    const day = buildDay(SUNNY_SUMMER_DAY, REFERENCE_DATE)
    for (const point of day.points) {
      const result = validateSnapshot(point.snapshot)
      expect(
        result.valid,
        `${point.timestamp.toISOString()}: ${result.warnings.join(', ')}`,
      ).toBe(true)
    }
  })

  it('all snapshots in a storm day pass validateSnapshot()', () => {
    const day = buildDay(STORM_NO_SOLAR, REFERENCE_DATE)
    for (const point of day.points) {
      expect(validateSnapshot(point.snapshot).valid).toBe(true)
    }
  })

  it('all snapshots in every scenario pass validateSnapshot()', () => {
    for (const scenario of ALL_SCENARIOS) {
      const day = buildDay(scenario, REFERENCE_DATE)
      for (const point of day.points) {
        const result = validateSnapshot(point.snapshot)
        expect(
          result.valid,
          `${scenario.id} at ${point.timestamp.toISOString()}: ${result.warnings.join(', ')}`,
        ).toBe(true)
      }
    }
  })
})

// ─── Energy balance ───────────────────────────────────────────────────────────

describe('buildDay — energy balance', () => {
  // Power balance (instantaneous): solar + import + discharge = home + export + charge
  // After rounding to integers, the maximum imbalance is 3 W (six terms × 0.5 W each).
  it('energy balance holds at every minute of a sunny day (tolerance 4 W)', () => {
    const day = buildDay(SUNNY_SUMMER_DAY, REFERENCE_DATE)
    for (const { snapshot } of day.points) {
      const { solar, grid, home, battery } = snapshot
      const powerIn =
        solar.generatingWatts + grid.importingWatts + battery.dischargingWatts
      const powerOut =
        home.consumingWatts + grid.exportingWatts + battery.chargingWatts
      expect(Math.abs(powerIn - powerOut)).toBeLessThan(4)
    }
  })

  it('energy balance holds for the battery-charging scenario', () => {
    const day = buildDay(BATTERY_CHARGING_THEN_EXPORTING, REFERENCE_DATE)
    for (const { snapshot } of day.points) {
      const { solar, grid, home, battery } = snapshot
      const powerIn =
        solar.generatingWatts + grid.importingWatts + battery.dischargingWatts
      const powerOut =
        home.consumingWatts + grid.exportingWatts + battery.chargingWatts
      expect(Math.abs(powerIn - powerOut)).toBeLessThan(4)
    }
  })

  it('no snapshot has simultaneous grid import and export', () => {
    for (const scenario of ALL_SCENARIOS) {
      const day = buildDay(scenario, REFERENCE_DATE)
      for (const { snapshot } of day.points) {
        const bothActive =
          snapshot.grid.importingWatts > 0 && snapshot.grid.exportingWatts > 0
        expect(bothActive).toBe(false)
      }
    }
  })

  it('no snapshot has simultaneous battery charge and discharge', () => {
    for (const scenario of ALL_SCENARIOS) {
      const day = buildDay(scenario, REFERENCE_DATE)
      for (const { snapshot } of day.points) {
        const bothActive =
          snapshot.battery.chargingWatts > 0 && snapshot.battery.dischargingWatts > 0
        expect(bothActive).toBe(false)
      }
    }
  })
})

// ─── Battery behaviour ────────────────────────────────────────────────────────

describe('buildDay — battery', () => {
  it('charge percent starts at initialChargePercent', () => {
    const day = buildDay(SUNNY_SUMMER_DAY, REFERENCE_DATE)
    expect(day.points[0]!.snapshot.battery.chargePercent).toBeCloseTo(
      SUNNY_SUMMER_DAY.battery.initialChargePercent,
      0,
    )
  })

  it('charge percent stays within 0–100 for every scenario', () => {
    for (const scenario of ALL_SCENARIOS) {
      const day = buildDay(scenario, REFERENCE_DATE)
      for (const { snapshot } of day.points) {
        expect(snapshot.battery.chargePercent).toBeGreaterThanOrEqual(0)
        expect(snapshot.battery.chargePercent).toBeLessThanOrEqual(100)
      }
    }
  })

  it('battery charges during solar hours on a sunny day', () => {
    const day = buildDay(SUNNY_SUMMER_DAY, REFERENCE_DATE)
    const midnight = day.points[0]!.snapshot.battery.chargePercent
    const noon = day.points[780]!.snapshot.battery.chargePercent  // 13:00
    expect(noon).toBeGreaterThan(midnight)
  })

  it('battery reaches 100% before the end of a sunny summer day', () => {
    const day = buildDay(SUNNY_SUMMER_DAY, REFERENCE_DATE)
    const reachedFull = day.points.some(p => p.snapshot.battery.chargePercent >= 99.5)
    expect(reachedFull).toBe(true)
  })

  it('battery depletes on a storm day with no solar', () => {
    const day = buildDay(STORM_NO_SOLAR, REFERENCE_DATE)
    const initial = STORM_NO_SOLAR.battery.initialChargePercent
    const noon = day.points[720]!.snapshot.battery.chargePercent
    expect(noon).toBeLessThan(initial)
  })
})

// ─── Solar behaviour ──────────────────────────────────────────────────────────

describe('buildDay — solar profiles', () => {
  it('zero solar at 03:00 on a sunny summer day', () => {
    const day = buildDay(SUNNY_SUMMER_DAY, REFERENCE_DATE)
    expect(day.points[3 * 60]!.snapshot.solar.generatingWatts).toBe(0)
  })

  it('near-peak solar at solar noon (13:00) on a sunny summer day', () => {
    const day = buildDay(SUNNY_SUMMER_DAY, REFERENCE_DATE)
    const noon = day.points[13 * 60]!.snapshot.solar.generatingWatts
    expect(noon).toBeGreaterThan(4500)
  })

  it('zero solar all day on storm day', () => {
    const day = buildDay(STORM_NO_SOLAR, REFERENCE_DATE)
    for (const point of day.points) {
      expect(point.snapshot.solar.generatingWatts).toBe(0)
    }
  })

  it('cloudy day has lower peak solar than sunny day', () => {
    const sunnyPeak = Math.max(
      ...buildDay(SUNNY_SUMMER_DAY, REFERENCE_DATE).points.map(
        p => p.snapshot.solar.generatingWatts,
      ),
    )
    const cloudyPeak = Math.max(
      ...buildDay(CLOUDY_DAY, REFERENCE_DATE).points.map(
        p => p.snapshot.solar.generatingWatts,
      ),
    )
    expect(cloudyPeak).toBeLessThan(sunnyPeak)
  })

  it('winter day has a shorter solar window than summer day', () => {
    const summerMinutes = buildDay(SUNNY_SUMMER_DAY, REFERENCE_DATE).points.filter(
      p => p.snapshot.solar.generatingWatts > 0,
    ).length
    const winterMinutes = buildDay(WINTER_DAY, REFERENCE_DATE).points.filter(
      p => p.snapshot.solar.generatingWatts > 0,
    ).length
    expect(winterMinutes).toBeLessThan(summerMinutes)
  })

  it('winter solar starts after 08:00', () => {
    const day = buildDay(WINTER_DAY, REFERENCE_DATE)
    // All minutes before 08:00 (index 480) should have zero solar
    const preDawnSolar = day.points
      .slice(0, 480)
      .some(p => p.snapshot.solar.generatingWatts > 0)
    expect(preDawnSolar).toBe(false)
  })
})

// ─── Scenario-specific behaviour ──────────────────────────────────────────────

describe('buildDay — EV charging overnight', () => {
  it('shows much higher home consumption at 03:00 than a regular day', () => {
    const regular = buildDay(SUNNY_SUMMER_DAY, REFERENCE_DATE)
    const withEv = buildDay(EV_CHARGING_OVERNIGHT, REFERENCE_DATE)
    const diff =
      withEv.points[180]!.snapshot.home.consumingWatts -
      regular.points[180]!.snapshot.home.consumingWatts
    expect(diff).toBeGreaterThan(6000)
  })

  it('applies cheap tariff during the overnight window', () => {
    const day = buildDay(EV_CHARGING_OVERNIGHT, REFERENCE_DATE)
    const nightTariff = day.points[180]!.snapshot.tariffs.importRate  // 03:00
    const dayTariff = day.points[720]!.snapshot.tariffs.importRate    // 12:00
    expect(nightTariff).toBeLessThan(dayTariff!)
  })
})

describe('buildDay — battery charging then exporting', () => {
  it('battery is charging from grid at 02:30', () => {
    const day = buildDay(BATTERY_CHARGING_THEN_EXPORTING, REFERENCE_DATE)
    const point = day.points[150]!  // 02:30
    expect(point.snapshot.battery.isCharging).toBe(true)
    expect(point.snapshot.grid.isImporting).toBe(true)
  })

  it('battery is at high charge after the cheap window ends (06:00)', () => {
    const day = buildDay(BATTERY_CHARGING_THEN_EXPORTING, REFERENCE_DATE)
    const charge = day.points[360]!.snapshot.battery.chargePercent  // 06:00
    expect(charge).toBeGreaterThan(60)
  })

  it('exports solar to grid at midday after battery is full', () => {
    const day = buildDay(BATTERY_CHARGING_THEN_EXPORTING, REFERENCE_DATE)
    const noon = day.points[780]!.snapshot  // 13:00
    expect(noon.grid.isExporting).toBe(true)
  })
})

describe('buildDay — heavy evening', () => {
  it('home consumption reaches a much higher evening peak than a standard day', () => {
    const regular = buildDay(SUNNY_SUMMER_DAY, REFERENCE_DATE)
    const heavy = buildDay(HEAVY_EVENING, REFERENCE_DATE)
    const regularPeak = Math.max(
      ...regular.points.slice(17 * 60, 21 * 60).map(p => p.snapshot.home.consumingWatts),
    )
    const heavyPeak = Math.max(
      ...heavy.points.slice(17 * 60, 21 * 60).map(p => p.snapshot.home.consumingWatts),
    )
    expect(heavyPeak).toBeGreaterThan(regularPeak + 1000)
  })

  it('total daily home consumption is higher than a standard day', () => {
    const regular = buildDay(SUNNY_SUMMER_DAY, REFERENCE_DATE)
    const heavy = buildDay(HEAVY_EVENING, REFERENCE_DATE)
    const regularTotal = regular.points[1439]!.dailySummary.home.consumedKwh
    const heavyTotal = heavy.points[1439]!.dailySummary.home.consumedKwh
    expect(heavyTotal).toBeGreaterThan(regularTotal)
  })
})

// ─── Daily summary accumulation ───────────────────────────────────────────────

describe('buildDay — daily summary', () => {
  it('solar kWh at noon is greater than at sunrise', () => {
    const day = buildDay(SUNNY_SUMMER_DAY, REFERENCE_DATE)
    const atSunrise = day.points[5 * 60 + 30]!.dailySummary.solar.generatedKwh  // 05:30
    const atNoon = day.points[13 * 60]!.dailySummary.solar.generatedKwh         // 13:00
    expect(atNoon).toBeGreaterThan(atSunrise)
  })

  it('total daily solar on a sunny summer day is within the expected range for a sine-bell model', () => {
    // A 5 kW system over a 16-hour window (05:00–21:00) with a sine-bell profile
    // integrates to 5 kW × 16 h × (2/π) ≈ 50.9 kWh — a clear-sky theoretical maximum.
    const day = buildDay(SUNNY_SUMMER_DAY, REFERENCE_DATE)
    const total = day.points[1439]!.dailySummary.solar.generatedKwh
    expect(total).toBeGreaterThan(40)
    expect(total).toBeLessThan(60)
  })

  it('storm day has zero solar in daily summary', () => {
    const day = buildDay(STORM_NO_SOLAR, REFERENCE_DATE)
    const total = day.points[1439]!.dailySummary.solar.generatedKwh
    expect(total).toBe(0)
  })

  it('daily summary values are non-negative', () => {
    for (const scenario of ALL_SCENARIOS) {
      const day = buildDay(scenario, REFERENCE_DATE)
      for (const { dailySummary } of day.points) {
        expect(dailySummary.solar.generatedKwh).toBeGreaterThanOrEqual(0)
        expect(dailySummary.battery.chargedKwh).toBeGreaterThanOrEqual(0)
        expect(dailySummary.battery.dischargedKwh).toBeGreaterThanOrEqual(0)
        expect(dailySummary.grid.importedKwh).toBeGreaterThanOrEqual(0)
        expect(dailySummary.grid.exportedKwh).toBeGreaterThanOrEqual(0)
        expect(dailySummary.home.consumedKwh).toBeGreaterThanOrEqual(0)
      }
    }
  })
})

// ─── at() lookup ──────────────────────────────────────────────────────────────

describe('buildDay — at()', () => {
  it('returns the correct point for a 13:00 timestamp', () => {
    const day = buildDay(SUNNY_SUMMER_DAY, REFERENCE_DATE)
    const noon = new Date(2026, 5, 27, 13, 0, 0)
    const point = day.at(noon)
    expect(point.timestamp.getHours()).toBe(13)
    expect(point.timestamp.getMinutes()).toBe(0)
  })

  it('clamps to the first point for timestamps before midnight', () => {
    const day = buildDay(SUNNY_SUMMER_DAY, REFERENCE_DATE)
    const beforeMidnight = new Date(REFERENCE_DATE.getTime() - 60_000)
    expect(day.at(beforeMidnight)).toBe(day.points[0])
  })

  it('clamps to the last point for timestamps at or after end of day', () => {
    const day = buildDay(SUNNY_SUMMER_DAY, REFERENCE_DATE)
    const nextDay = new Date(2026, 5, 28, 0, 0, 0)
    expect(day.at(nextDay)).toBe(day.points[1439])
  })

  it('returns the same point as direct array access for minute 300 (05:00)', () => {
    const day = buildDay(SUNNY_SUMMER_DAY, REFERENCE_DATE)
    const fiveAm = new Date(2026, 5, 27, 5, 0, 0)
    expect(day.at(fiveAm)).toBe(day.points[300])
  })
})
