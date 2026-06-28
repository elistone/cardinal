import { computed, shallowRef } from 'vue'
import { buildDay, buildWaveform, SUNNY_SUMMER_DAY } from '@cardinal/simulation'
import type { SimulatedDay } from '@cardinal/simulation'
import { useHistoryStore } from '../stores/history'

function buildTodaySimulatedDay(): SimulatedDay {
  const today = new Date()
  return buildDay(SUNNY_SUMMER_DAY, today)
}

/**
 * Wires the simulation engine to the history store, enabling Time Travel.
 *
 * Today's day is simulated from SUNNY_SUMMER_DAY and used as the historical
 * data source for scrubbing. When the user seeks to a timestamp, the
 * corresponding simulated snapshot is pushed into the history store, updating
 * every component that reads from currentSnapshot.
 *
 * When real HA historical data is available, this composable should be replaced
 * (or supplemented) by a provider backed by IHistoricalSnapshotProvider.
 */
export function useTimeTravel() {
  const historyStore = useHistoryStore()
  const day = shallowRef<SimulatedDay>(buildTodaySimulatedDay())

  const waveform = computed<readonly number[]>(() => buildWaveform(day.value))

  const dayStart = computed<Date>(() => day.value.date)

  const dayEnd = computed<Date>(
    () => new Date(day.value.date.getTime() + 24 * 60 * 60 * 1000 - 1),
  )

  function seek(timestamp: Date): void {
    const point = day.value.at(timestamp)
    historyStore.enterHistoricalMode(timestamp)
    historyStore.setHistoricalSnapshot(point.snapshot, point.dailySummary)
  }

  function goLive(): void {
    historyStore.exitHistoricalMode()
  }

  return {
    waveform,
    dayStart,
    dayEnd,
    seek,
    goLive,
  }
}
