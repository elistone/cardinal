import { readdirSync, readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { HassState, HassEntityMapping } from '@cardinal/providers'

const FIXTURES_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'fixtures')

const SUPPORTED_SCHEMA_VERSION = 1

export interface FixtureEntity {
  state: string
  attributes: Record<string, unknown>
}

export interface SnapshotExpected {
  solar: { generatingWatts: number; isGenerating: boolean }
  battery: {
    chargePercent: number
    chargingWatts: number
    dischargingWatts: number
    isCharging: boolean
    isDischarging: boolean
    isIdle: boolean
  }
  grid: {
    importingWatts: number
    exportingWatts: number
    isImporting: boolean
    isExporting: boolean
    isIdle: boolean
  }
  home: { consumingWatts: number }
}

export interface InsightExpected {
  type: string
  sentiment: string
  title: string
}

export interface SnapshotFixture {
  schemaVersion: number
  id: string
  description: string
  capturedAt: string
  metadata?: Record<string, string>
  entities: Record<string, FixtureEntity>
  mapping: HassEntityMapping
  expected: {
    snapshot: SnapshotExpected
    insight: InsightExpected
  }
}

export interface EventFixtureHalf {
  capturedAt: string
  entities: Record<string, FixtureEntity>
  mapping: HassEntityMapping
}

export interface EventFixture {
  schemaVersion: number
  id: string
  description: string
  metadata?: Record<string, string>
  before: EventFixtureHalf
  after: EventFixtureHalf
  expected: {
    events: Array<{ type: string }>
  }
}

function loadFixtures<T extends { schemaVersion: number; id: string }>(subdir: string): T[] {
  const dir = join(FIXTURES_DIR, subdir)
  return readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .sort()
    .map((f) => {
      const fixture = JSON.parse(readFileSync(join(dir, f), 'utf-8')) as T
      if (fixture.schemaVersion !== SUPPORTED_SCHEMA_VERSION) {
        throw new Error(
          `Fixture "${fixture.id}" uses schemaVersion ${fixture.schemaVersion}, ` +
            `but this test suite only supports version ${SUPPORTED_SCHEMA_VERSION}.`,
        )
      }
      return fixture
    })
}

export function loadSnapshotFixtures(): SnapshotFixture[] {
  return loadFixtures<SnapshotFixture>('snapshot')
}

export function loadEventFixtures(): EventFixture[] {
  return loadFixtures<EventFixture>('event')
}

export function toHassStates(
  entities: Record<string, FixtureEntity>,
  capturedAt: string,
): Record<string, HassState> {
  return Object.fromEntries(
    Object.entries(entities).map(([id, e]) => [
      id,
      {
        entity_id: id,
        state: e.state,
        attributes: e.attributes,
        last_changed: capturedAt,
        last_updated: capturedAt,
      },
    ]),
  )
}
