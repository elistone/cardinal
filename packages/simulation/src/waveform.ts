import type { SimulatedDay } from './types.js'

/**
 * Builds a normalised solar waveform from a SimulatedDay.
 *
 * Returns `buckets` values in [0, 1], where 1 represents the day's peak solar
 * output and each bucket is the average of the minutes it covers.
 *
 * Intended for rendering the timeline track — navigation, not charting.
 */
export function buildWaveform(day: SimulatedDay, buckets = 120): readonly number[] {
  const bucketSize = Math.floor(1440 / buckets)
  let maxW = 0
  for (const point of day.points) {
    if (point.snapshot.solar.generatingWatts > maxW) {
      maxW = point.snapshot.solar.generatingWatts
    }
  }
  const result: number[] = []
  for (let i = 0; i < buckets; i++) {
    let sum = 0
    for (let j = 0; j < bucketSize; j++) {
      sum += day.points[i * bucketSize + j]?.snapshot.solar.generatingWatts ?? 0
    }
    result.push(maxW > 0 ? sum / bucketSize / maxW : 0)
  }
  return result
}
