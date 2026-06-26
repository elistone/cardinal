import { describe, it, expect } from 'vitest'
import { describeEnergyState } from './summary'
import { makeSolar, makeBattery, makeGrid, makeHome, makeSnapshot, FIXED_TIMESTAMP } from './__tests__/helpers'

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

describe('describeEnergyState', () => {
  describe('metadata', () => {
    it('generates a valid UUID for each insight', () => {
      const snapshot = makeSnapshot()
      const insight = describeEnergyState(snapshot)
      expect(insight.id).toMatch(UUID_PATTERN)
    })

    it('uses the snapshot timestamp, not the current time', () => {
      const snapshot = makeSnapshot({ timestamp: FIXED_TIMESTAMP })
      const insight = describeEnergyState(snapshot)
      expect(insight.timestamp).toBe(FIXED_TIMESTAMP)
    })

    it('always produces high confidence for sensor-derived insights', () => {
      const insight = describeEnergyState(makeSnapshot())
      expect(insight.confidence).toBe('high')
    })

    it('always produces normal priority for live state insights', () => {
      const insight = describeEnergyState(makeSnapshot())
      expect(insight.priority).toBe('normal')
    })

    it('always produces non-empty title and description', () => {
      const insight = describeEnergyState(makeSnapshot())
      expect(insight.title.length).toBeGreaterThan(0)
      expect(insight.description.length).toBeGreaterThan(0)
    })
  })

  describe('battery_charging_solar', () => {
    it('is selected when battery is charging and solar exceeds battery draw', () => {
      const snapshot = makeSnapshot({
        solar: makeSolar(3000),
        battery: makeBattery({ chargingWatts: 2000 }),
        grid: makeGrid(),
      })
      const insight = describeEnergyState(snapshot)
      expect(insight.type).toBe('battery_charging_solar')
      expect(insight.sentiment).toBe('positive')
    })

    it('is not selected when solar equals battery charging watts', () => {
      // Solar == battery charging: falls through to another condition
      const snapshot = makeSnapshot({
        solar: makeSolar(2000),
        battery: makeBattery({ chargingWatts: 2000 }),
        grid: makeGrid(),
      })
      const insight = describeEnergyState(snapshot)
      expect(insight.type).not.toBe('battery_charging_solar')
    })
  })

  describe('battery_charging_grid', () => {
    it('is selected when battery is charging and grid is importing', () => {
      const snapshot = makeSnapshot({
        solar: makeSolar(0),
        battery: makeBattery({ chargingWatts: 2500 }),
        grid: makeGrid({ importingWatts: 2500 }),
      })
      const insight = describeEnergyState(snapshot)
      expect(insight.type).toBe('battery_charging_grid')
      expect(insight.sentiment).toBe('neutral')
    })
  })

  describe('battery_discharging', () => {
    it('is positive when battery is discharging without grid import', () => {
      const snapshot = makeSnapshot({
        solar: makeSolar(500),
        battery: makeBattery({ dischargingWatts: 1500 }),
        grid: makeGrid(),
      })
      const insight = describeEnergyState(snapshot)
      expect(insight.type).toBe('battery_discharging')
      expect(insight.sentiment).toBe('positive')
    })

    it('is neutral when battery is discharging alongside grid import', () => {
      const snapshot = makeSnapshot({
        solar: makeSolar(0),
        battery: makeBattery({ dischargingWatts: 1000 }),
        grid: makeGrid({ importingWatts: 500 }),
      })
      const insight = describeEnergyState(snapshot)
      expect(insight.type).toBe('battery_discharging')
      expect(insight.sentiment).toBe('neutral')
    })
  })

  describe('solar_exporting', () => {
    it('is selected when solar is generating and grid is exporting', () => {
      const snapshot = makeSnapshot({
        solar: makeSolar(5000),
        battery: makeBattery(),
        grid: makeGrid({ exportingWatts: 2000 }),
      })
      const insight = describeEnergyState(snapshot)
      expect(insight.type).toBe('solar_exporting')
      expect(insight.sentiment).toBe('positive')
    })
  })

  describe('solar_covering', () => {
    it('is selected when solar is generating and covers all demand without grid', () => {
      const snapshot = makeSnapshot({
        solar: makeSolar(2000),
        battery: makeBattery(),
        grid: makeGrid(),
      })
      const insight = describeEnergyState(snapshot)
      expect(insight.type).toBe('solar_covering')
      expect(insight.sentiment).toBe('positive')
    })

    it('is also selected when solar is assisting but grid is still importing', () => {
      const snapshot = makeSnapshot({
        solar: makeSolar(1000),
        battery: makeBattery(),
        grid: makeGrid({ importingWatts: 500 }),
      })
      const insight = describeEnergyState(snapshot)
      expect(insight.type).toBe('solar_covering')
      expect(insight.sentiment).toBe('positive')
    })
  })

  describe('grid_importing', () => {
    it('is selected when no solar, no battery activity, and grid is the only source', () => {
      const snapshot = makeSnapshot({
        solar: makeSolar(0),
        battery: makeBattery(),
        grid: makeGrid({ importingWatts: 1000 }),
        home: makeHome(1000),
      })
      const insight = describeEnergyState(snapshot)
      expect(insight.type).toBe('grid_importing')
      expect(insight.sentiment).toBe('neutral')
    })

    it('is the fallback when no other condition matches', () => {
      const snapshot = makeSnapshot({
        solar: makeSolar(0),
        battery: makeBattery(),
        grid: makeGrid(),
        home: makeHome(0),
      })
      const insight = describeEnergyState(snapshot)
      expect(insight.type).toBe('grid_importing')
    })
  })

  describe('detail text', () => {
    it('battery_charging_solar: mentions charge % and rising', () => {
      const snapshot = makeSnapshot({
        solar: makeSolar(3000),
        battery: makeBattery({ chargingWatts: 2000, chargePercent: 45 }),
        grid: makeGrid(),
      })
      const { detail } = describeEnergyState(snapshot)
      expect(detail).toContain('45%')
      expect(detail).toContain('rising')
    })

    it('battery_charging_solar: includes grid export clause when exporting', () => {
      const snapshot = makeSnapshot({
        solar: makeSolar(4000),
        battery: makeBattery({ chargingWatts: 2000 }),
        grid: makeGrid({ exportingWatts: 1000 }),
      })
      const { detail } = describeEnergyState(snapshot)
      expect(detail).toContain('grid')
    })

    it('battery_charging_grid: mentions charge % and charging rate', () => {
      const snapshot = makeSnapshot({
        solar: makeSolar(0),
        battery: makeBattery({ chargingWatts: 2500, chargePercent: 30 }),
        grid: makeGrid({ importingWatts: 2500 }),
      })
      const { detail } = describeEnergyState(snapshot)
      expect(detail).toContain('30%')
      expect(detail).toContain('charging at')
    })

    it('battery_discharging (with grid): mentions charge % and discharge watts', () => {
      const snapshot = makeSnapshot({
        solar: makeSolar(0),
        battery: makeBattery({ dischargingWatts: 1000, chargePercent: 60 }),
        grid: makeGrid({ importingWatts: 500 }),
      })
      const { detail } = describeEnergyState(snapshot)
      expect(detail).toContain('60%')
      expect(detail).toContain('supplying')
    })

    it('battery_discharging (no grid): mentions charge % and supplying watts', () => {
      const snapshot = makeSnapshot({
        solar: makeSolar(0),
        battery: makeBattery({ dischargingWatts: 2000, chargePercent: 80 }),
        grid: makeGrid(),
      })
      const { detail } = describeEnergyState(snapshot)
      expect(detail).toContain('80%')
      expect(detail).toContain('supplying')
    })

    it('solar_exporting: mentions watts sent to grid', () => {
      const snapshot = makeSnapshot({
        solar: makeSolar(5000),
        battery: makeBattery(),
        grid: makeGrid({ exportingWatts: 2000 }),
      })
      const { detail } = describeEnergyState(snapshot)
      expect(detail).toContain('grid')
    })

    it('solar_covering (no import): mentions generating watts', () => {
      const snapshot = makeSnapshot({
        solar: makeSolar(2000),
        battery: makeBattery(),
        grid: makeGrid(),
      })
      const { detail } = describeEnergyState(snapshot)
      expect(detail).toContain('Generating')
    })

    it('solar_covering (with import): mentions both generating and importing', () => {
      const snapshot = makeSnapshot({
        solar: makeSolar(1000),
        battery: makeBattery(),
        grid: makeGrid({ importingWatts: 500 }),
      })
      const { detail } = describeEnergyState(snapshot)
      expect(detail).toContain('Generating')
      expect(detail).toContain('importing')
    })

    it('grid_importing: is "No solar generation right now." when no solar', () => {
      const snapshot = makeSnapshot({
        solar: makeSolar(0),
        battery: makeBattery(),
        grid: makeGrid({ importingWatts: 1000 }),
        home: makeHome(1000),
      })
      const { detail } = describeEnergyState(snapshot)
      expect(detail).toBe('No solar generation right now.')
    })
  })
})
