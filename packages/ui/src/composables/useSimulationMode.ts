import { ref, computed, onUnmounted } from 'vue'
import type { SimulatedDay } from '@cardinal/simulation'
import { describeEnergyState } from '@cardinal/core'

export interface SimulationModeOptions {
  /** Simulated minutes advanced per real-world second. Default: 60 (one hour of simulation per second). */
  readonly minutesPerSecond?: number
  /** Whether to restart from midnight when the day ends. Default: true. */
  readonly loop?: boolean
}

/**
 * Advances through a pre-built SimulatedDay in real time, exposing reactive
 * snapshot, insight, and daily summary values that update each second.
 *
 * Components consume the same snapshot/insight props they always do — they
 * have no knowledge that the data is simulated.
 *
 * @example
 * const day = buildDay(SUNNY_SUMMER_DAY, new Date())
 * const { snapshot, insight } = useSimulationMode(day, { minutesPerSecond: 30 })
 */
export function useSimulationMode(day: SimulatedDay, options?: SimulationModeOptions) {
  const minutesPerSecond = Math.max(1, Math.round(options?.minutesPerSecond ?? 60))
  const loop = options?.loop ?? true

  const minuteOfDay = ref(0)

  const currentPoint = computed(() => day.points[minuteOfDay.value]!)
  const snapshot = computed(() => currentPoint.value.snapshot)
  const dailySummary = computed(() => currentPoint.value.dailySummary)
  const insight = computed(() => describeEnergyState(snapshot.value))
  const currentTimestamp = computed(() => currentPoint.value.timestamp)
  const progress = computed(() => minuteOfDay.value / (day.points.length - 1))

  let timer: ReturnType<typeof setInterval> | null = null

  function tick() {
    const next = minuteOfDay.value + minutesPerSecond
    if (next >= day.points.length) {
      minuteOfDay.value = loop ? 0 : day.points.length - 1
    } else {
      minuteOfDay.value = next
    }
  }

  function start() {
    if (timer !== null) return
    timer = setInterval(tick, 1000)
  }

  function stop() {
    if (timer !== null) {
      clearInterval(timer)
      timer = null
    }
  }

  function seekToMinute(minute: number) {
    minuteOfDay.value = Math.max(0, Math.min(day.points.length - 1, Math.round(minute)))
  }

  function seekTo(timestamp: Date) {
    const minutesSinceMidnight = Math.floor(
      (timestamp.getTime() - day.date.getTime()) / 60_000,
    )
    seekToMinute(minutesSinceMidnight)
  }

  start()
  onUnmounted(stop)

  return {
    snapshot,
    dailySummary,
    insight,
    currentTimestamp,
    /** 0–1 fraction of the day elapsed. */
    progress,
    minuteOfDay,
    start,
    stop,
    seekTo,
    seekToMinute,
  }
}
