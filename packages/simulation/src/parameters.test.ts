import { describe, it, expect } from 'vitest'
import { buildScenarioFromParameters, buildDay } from './index.js'
import { validateSnapshot } from '@cardinal/core'
import { STORM_NO_SOLAR } from './scenarios.js'
import type { ScenarioParameters } from './parameters.js'

// ─── Fixture ──────────────────────────────────────────────────────────────────

const SUMMER_FLAT: ScenarioParameters = {
  id: 'test-summer-flat',
  name: 'Test: Summer flat tariff',
  description: 'Verification fixture — 5 kW solar, standard home, flat tariff.',
  solar: {
    peakWatts: 5000,
    sunriseHour: 5,
    sunsetHour: 21,
  },
  home: {
    overnightWatts: 450,
    morningPeakWatts: 1200,
    morningPeakHour: 8,
    eveningPeakWatts: 2800,
    eveningPeakHour: 19,
  },
  battery: {
    capacityKwh: 10,
    initialChargePercent: 20,
    maxChargeRateWatts: 5000,
    maxDischargeRateWatts: 5000,
    efficiency: 0.92,
  },
  tariffs: {
    kind: 'flat',
    importRate: 0.245,
    exportRate: 0.15,
  },
}

const TOU_BATTERY_CHARGING: ScenarioParameters = {
  id: 'test-tou-battery',
  name: 'Test: TOU with grid charge window',
  description: 'Verification fixture — cheap rate 01:00–05:00, grid charges battery.',
  solar: {
    peakWatts: 4500,
    sunriseHour: 5,
    sunsetHour: 21,
  },
  home: {
    overnightWatts: 450,
    morningPeakWatts: 1200,
    morningPeakHour: 8,
    eveningPeakWatts: 2800,
    eveningPeakHour: 19,
  },
  battery: {
    capacityKwh: 10,
    initialChargePercent: 5,
    maxChargeRateWatts: 5000,
    maxDischargeRateWatts: 5000,
    efficiency: 0.92,
  },
  tariffs: {
    kind: 'tou',
    cheapRate: 0.085,
    peakRate: 0.295,
    exportRate: 0.15,
    cheapStartHour: 1,
    cheapEndHour: 5,
  },
  gridChargeWindows: [
    { startHour: 1, endHour: 5, chargeRateWatts: 3300 },
  ],
}

const EV_OVERNIGHT: ScenarioParameters = {
  id: 'test-ev-overnight',
  name: 'Test: EV overnight (spanning midnight)',
  description: 'Verification fixture — EV charges from 23:30 to 07:00.',
  solar: {
    peakWatts: 4500,
    sunriseHour: 5,
    sunsetHour: 21,
  },
  home: {
    overnightWatts: 450,
    morningPeakWatts: 1200,
    morningPeakHour: 8,
    eveningPeakWatts: 2800,
    eveningPeakHour: 19,
    ev: {
      chargeRateWatts: 7200,
      startHour: 23.5,
      endHour: 7,
    },
  },
  battery: {
    capacityKwh: 10,
    initialChargePercent: 30,
    maxChargeRateWatts: 5000,
    maxDischargeRateWatts: 5000,
    efficiency: 0.92,
  },
  tariffs: {
    kind: 'tou',
    cheapRate: 0.075,
    peakRate: 0.245,
    exportRate: 0.15,
    cheapStartHour: 23.5,
    cheapEndHour: 7,
  },
}

const REFERENCE_DATE = new Date(2026, 5, 27)

// ─── buildScenarioFromParameters ─────────────────────────────────────────────

describe('buildScenarioFromParameters', () => {
  it('returns a SimulationScenario with the correct id, name, and description', () => {
    const scenario = buildScenarioFromParameters(SUMMER_FLAT)
    expect(scenario.id).toBe(SUMMER_FLAT.id)
    expect(scenario.name).toBe(SUMMER_FLAT.name)
    expect(scenario.description).toBe(SUMMER_FLAT.description)
  })

  it('preserves battery configuration', () => {
    const scenario = buildScenarioFromParameters(SUMMER_FLAT)
    expect(scenario.battery.capacityKwh).toBe(10)
    expect(scenario.battery.initialChargePercent).toBe(20)
    expect(scenario.battery.efficiency).toBe(0.92)
  })

  it('produces zero solar before sunrise', () => {
    const scenario = buildScenarioFromParameters(SUMMER_FLAT)
    const t = 3 / 24  // 03:00
    expect(scenario.solarProfile(t)).toBe(0)
  })

  it('produces near-peak solar at solar noon', () => {
    const scenario = buildScenarioFromParameters(SUMMER_FLAT)
    const t = 13 / 24  // 13:00 (midpoint of 5am–9pm)
    expect(scenario.solarProfile(t)).toBeGreaterThan(4800)
  })

  it('produces zero solar after sunset', () => {
    const scenario = buildScenarioFromParameters(SUMMER_FLAT)
    const t = 22 / 24  // 22:00
    expect(scenario.solarProfile(t)).toBe(0)
  })

  it('flat tariff returns the specified import and export rates', () => {
    const scenario = buildScenarioFromParameters(SUMMER_FLAT)
    const tariff = scenario.tariffs(0.5)  // midday
    expect(tariff.importRate).toBe(0.245)
    expect(tariff.exportRate).toBe(0.15)
    expect(tariff.currency).toBe('GBP')
  })

  it('tou tariff returns cheap rate during the cheap window', () => {
    const scenario = buildScenarioFromParameters(TOU_BATTERY_CHARGING)
    const duringCheap = scenario.tariffs(2 / 24)  // 02:00
    const duringPeak = scenario.tariffs(12 / 24)  // 12:00
    expect(duringCheap.importRate).toBe(0.085)
    expect(duringPeak.importRate).toBe(0.295)
  })

  it('overnight tou tariff handles windows that span midnight', () => {
    const scenario = buildScenarioFromParameters(EV_OVERNIGHT)
    const midnight = scenario.tariffs(0)             // 00:00 — inside cheap window
    const earlyMorning = scenario.tariffs(3 / 24)   // 03:00 — inside cheap window
    const midday = scenario.tariffs(12 / 24)        // 12:00 — outside cheap window
    const lateNight = scenario.tariffs(23.75 / 24)  // 23:45 — inside cheap window
    expect(midnight.importRate).toBe(0.075)
    expect(earlyMorning.importRate).toBe(0.075)
    expect(midday.importRate).toBe(0.245)
    expect(lateNight.importRate).toBe(0.075)
  })
})

// ─── All generated snapshots are valid ────────────────────────────────────────

describe('buildScenarioFromParameters — snapshot validity', () => {
  it('all snapshots from a flat-tariff scenario pass validateSnapshot()', () => {
    const scenario = buildScenarioFromParameters(SUMMER_FLAT)
    const day = buildDay(scenario, REFERENCE_DATE)
    for (const point of day.points) {
      const result = validateSnapshot(point.snapshot)
      expect(
        result.valid,
        `${point.timestamp.toISOString()}: ${result.warnings.join(', ')}`,
      ).toBe(true)
    }
  })

  it('all snapshots from a tou + grid-charge scenario pass validateSnapshot()', () => {
    const scenario = buildScenarioFromParameters(TOU_BATTERY_CHARGING)
    const day = buildDay(scenario, REFERENCE_DATE)
    for (const point of day.points) {
      expect(validateSnapshot(point.snapshot).valid).toBe(true)
    }
  })

  it('all snapshots from an EV overnight scenario pass validateSnapshot()', () => {
    const scenario = buildScenarioFromParameters(EV_OVERNIGHT)
    const day = buildDay(scenario, REFERENCE_DATE)
    for (const point of day.points) {
      expect(validateSnapshot(point.snapshot).valid).toBe(true)
    }
  })
})

// ─── EV overnight window spanning midnight ────────────────────────────────────

describe('buildScenarioFromParameters — EV overnight', () => {
  it('EV adds load at 03:00 (early-morning portion of overnight window)', () => {
    const withEv = buildScenarioFromParameters(EV_OVERNIGHT)
    const withoutEv = buildScenarioFromParameters({ ...EV_OVERNIGHT, home: { ...EV_OVERNIGHT.home, ev: undefined } })
    const t = 3 / 24
    expect(withEv.homeProfile(t)).toBeGreaterThan(withoutEv.homeProfile(t) + 6000)
  })

  it('EV adds no load at 12:00 (outside overnight window)', () => {
    const withEv = buildScenarioFromParameters(EV_OVERNIGHT)
    const withoutEv = buildScenarioFromParameters({ ...EV_OVERNIGHT, home: { ...EV_OVERNIGHT.home, ev: undefined } })
    const t = 12 / 24
    expect(Math.abs(withEv.homeProfile(t) - withoutEv.homeProfile(t))).toBeLessThan(1)
  })
})

// ─── Multi-day chaining (DayState) ───────────────────────────────────────────

describe('buildDay — multi-day chaining', () => {
  it('endState reflects battery charge at 23:59', () => {
    const scenario = buildScenarioFromParameters(SUMMER_FLAT)
    const day = buildDay(scenario, REFERENCE_DATE)
    const lastMinute = day.points[1439]!.snapshot.battery.chargePercent
    expect(day.endState.batteryChargePercent).toBeCloseTo(lastMinute, 1)
  })

  it('chained day starts with battery at previous day endState', () => {
    const scenario = buildScenarioFromParameters(SUMMER_FLAT)
    const day1 = buildDay(scenario, REFERENCE_DATE)
    const day2Start = new Date(2026, 5, 28)
    const day2 = buildDay(scenario, day2Start, { initialState: day1.endState })
    expect(day2.points[0]!.snapshot.battery.chargePercent).toBeCloseTo(
      day1.endState.batteryChargePercent,
      0,
    )
  })

  it('chaining produces different results than using initialChargePercent when battery is depleted', () => {
    // Storm scenario: battery drains. If we chain, day 2 starts with a low battery.
    // If we don't chain, day 2 starts at initialChargePercent (60%).
    const day1 = buildDay(STORM_NO_SOLAR, REFERENCE_DATE)
    const day2Chained = buildDay(STORM_NO_SOLAR, new Date(2026, 5, 28), {
      initialState: day1.endState,
    })
    const day2Unchained = buildDay(STORM_NO_SOLAR, new Date(2026, 5, 28))

    // The chained day 2 should start with a lower battery than the unchained day 2
    const chainedStart = day2Chained.points[0]!.snapshot.battery.chargePercent
    const unchainedStart = day2Unchained.points[0]!.snapshot.battery.chargePercent
    expect(chainedStart).toBeLessThan(unchainedStart)
  })

  it('all points in a chained day pass validateSnapshot()', () => {
    const scenario = buildScenarioFromParameters(SUMMER_FLAT)
    const day1 = buildDay(scenario, REFERENCE_DATE)
    const day2 = buildDay(scenario, new Date(2026, 5, 28), { initialState: day1.endState })
    for (const point of day2.points) {
      expect(validateSnapshot(point.snapshot).valid).toBe(true)
    }
  })
})
