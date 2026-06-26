import { describe, it } from 'vitest'
import { loadEventFixtures } from './helpers'

// Event detection requires detectEvents() from @cardinal/core, which is not yet implemented.
// Fixtures are defined and ready; tests will be enabled once the function ships.

const fixtures = loadEventFixtures()

for (const fixture of fixtures) {
  describe(fixture.id, () => {
    it.todo(
      `detects events: ${fixture.expected.events.map((e) => e.type).join(', ')}`,
    )
  })
}
