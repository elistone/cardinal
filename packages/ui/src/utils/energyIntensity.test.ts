import { describe, it, expect } from 'vitest'
import { energyIntensity } from './energyIntensity.js'

describe('energyIntensity', () => {
  describe('boundary values', () => {
    it('returns 0 for zero watts', () => {
      expect(energyIntensity(0)).toBe(0)
    })

    it('returns 0 for negative watts', () => {
      expect(energyIntensity(-100)).toBe(0)
    })

    it('returns 1 for the reference maximum (5000 W)', () => {
      expect(energyIntensity(5000)).toBe(1)
    })

    it('returns 1 for values above the reference maximum', () => {
      expect(energyIntensity(10000)).toBe(1)
    })

    it('returns 0 for values at or below the floor (50 W)', () => {
      expect(energyIntensity(50)).toBeCloseTo(0, 5)
      expect(energyIntensity(25)).toBeCloseTo(0, 5)
    })
  })

  describe('scaling behaviour', () => {
    it('is monotonically increasing', () => {
      // Use explicit arrow fn — passing energyIntensity directly would receive
      // the array index as the maxWatts argument.
      const values = [100, 500, 1000, 2000, 3500, 5000]
      const intensities = values.map(w => energyIntensity(w))
      for (let i = 1; i < intensities.length; i++) {
        expect(intensities[i]).toBeGreaterThan(intensities[i - 1]!)
      }
    })

    it('places 1 kW meaningfully above a linear midpoint (logarithmic compression)', () => {
      // Linear midpoint of 0–5000 W is 2500 W = 0.5 scale.
      // Log scale puts 1000 W at ~0.65 — well above the linear 0.2 (1000/5000).
      // This verifies low wattages are not compressed to near-zero.
      const t = energyIntensity(1000)
      expect(t).toBeGreaterThan(0.5)
      expect(t).toBeLessThan(0.75)
    })

    it('is visually distinguishable at both low and high ends', () => {
      const low  = energyIntensity(150)
      const high = energyIntensity(4000)
      expect(high - low).toBeGreaterThan(0.3)
    })
  })

  describe('custom maximum', () => {
    it('returns 1 at the custom maximum', () => {
      expect(energyIntensity(2000, 2000)).toBe(1)
    })

    it('scales correctly relative to a custom maximum', () => {
      const t500_2k  = energyIntensity(500, 2000)
      const t500_5k  = energyIntensity(500, 5000)
      // With a lower max, 500 W should have higher relative intensity
      expect(t500_2k).toBeGreaterThan(t500_5k)
    })
  })
})
