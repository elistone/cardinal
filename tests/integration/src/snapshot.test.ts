import { describe, it, expect } from 'vitest'
import { translateEnergySnapshot } from '@cardinal/providers'
import { loadSnapshotFixtures, toHassStates } from './helpers'

const fixtures = loadSnapshotFixtures()

for (const fixture of fixtures) {
  describe(fixture.id, () => {
    it('translates entity states to the expected solar state', () => {
      const states = toHassStates(fixture.entities, fixture.capturedAt)
      const snapshot = translateEnergySnapshot(states, fixture.mapping)
      expect(snapshot.solar).toMatchObject(fixture.expected.snapshot.solar)
    })

    it('translates entity states to the expected battery state', () => {
      const states = toHassStates(fixture.entities, fixture.capturedAt)
      const snapshot = translateEnergySnapshot(states, fixture.mapping)
      expect(snapshot.battery).toMatchObject(fixture.expected.snapshot.battery)
    })

    it('translates entity states to the expected grid state', () => {
      const states = toHassStates(fixture.entities, fixture.capturedAt)
      const snapshot = translateEnergySnapshot(states, fixture.mapping)
      expect(snapshot.grid).toMatchObject(fixture.expected.snapshot.grid)
    })

    it('translates entity states to the expected home state', () => {
      const states = toHassStates(fixture.entities, fixture.capturedAt)
      const snapshot = translateEnergySnapshot(states, fixture.mapping)
      expect(snapshot.home).toMatchObject(fixture.expected.snapshot.home)
    })
  })
}
