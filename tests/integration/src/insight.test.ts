import { describe, it, expect } from 'vitest'
import { translateEnergySnapshot } from '@cardinal/providers'
import { describeEnergyState } from '@cardinal/core'
import { loadSnapshotFixtures, toHassStates } from './helpers'

const fixtures = loadSnapshotFixtures()

for (const fixture of fixtures) {
  describe(fixture.id, () => {
    it('produces the expected insight type', () => {
      const states = toHassStates(fixture.entities, fixture.capturedAt)
      const snapshot = translateEnergySnapshot(states, fixture.mapping)
      const insight = describeEnergyState(snapshot)
      expect(insight.type).toBe(fixture.expected.insight.type)
    })

    it('produces the expected insight sentiment', () => {
      const states = toHassStates(fixture.entities, fixture.capturedAt)
      const snapshot = translateEnergySnapshot(states, fixture.mapping)
      const insight = describeEnergyState(snapshot)
      expect(insight.sentiment).toBe(fixture.expected.insight.sentiment)
    })

    it('produces the expected insight title', () => {
      const states = toHassStates(fixture.entities, fixture.capturedAt)
      const snapshot = translateEnergySnapshot(states, fixture.mapping)
      const insight = describeEnergyState(snapshot)
      expect(insight.title).toBe(fixture.expected.insight.title)
    })
  })
}
