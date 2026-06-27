// Maps a watt value to a normalised intensity in [0, 1] using a logarithmic
// scale, so that both low (100 W) and high (5000 W) values remain visually
// distinguishable rather than collapsing toward zero at the low end.
//
// Threshold:
//   50 W  → 0   (below perception threshold — treated as inactive)
//   5000 W → 1  (reference maximum for a typical home system)
//
// Used by EnergyFlowDiagram (flow speed, stroke width), MetricCard (accent bar
// height and opacity, ambient background tint), and any other component that
// needs to communicate energy magnitude visually.

const FLOOR_WATTS = 50
const DEFAULT_MAX_WATTS = 5000

export function energyIntensity(watts: number, maxWatts = DEFAULT_MAX_WATTS): number {
  if (watts <= 0) return 0
  const clamped = Math.max(FLOOR_WATTS, Math.min(watts, maxWatts))
  return Math.log10(clamped / FLOOR_WATTS) / Math.log10(maxWatts / FLOOR_WATTS)
}
