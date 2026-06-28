import type { TariffState } from '@cardinal/domain'

/**
 * Returns a solar output profile (watts) shaped as a sine bell between
 * sunriseT and sunsetT, peaking at their midpoint.
 *
 * The sine curve naturally models a real solar day: slow rise, strong midday
 * peak, and symmetric decline to sunset — no output outside the solar window.
 */
export function solarBell(
  peakWatts: number,
  sunriseT: number,
  sunsetT: number,
): (t: number) => number {
  return (t: number) => {
    if (t <= sunriseT || t >= sunsetT) return 0
    const progress = (t - sunriseT) / (sunsetT - sunriseT)
    return peakWatts * Math.sin(progress * Math.PI)
  }
}

/** A Gaussian bump centred at centerT with the given half-width in day-fractions. */
function gaussian(centerT: number, halfWidth: number): (t: number) => number {
  const k = 1 / halfWidth
  return (t: number) => {
    const x = (t - centerT) * k
    return Math.exp(-(x * x))
  }
}

/**
 * Builds a home consumption profile (watts) with a realistic overnight
 * baseload, a morning activity peak, and a larger evening peak.
 *
 * The Gaussian peaks ensure smooth ramps rather than step changes, which
 * produces more realistic energy flows through the simulation.
 */
export function standardHomeProfile(
  overnightWatts: number,
  morningPeakWatts: number,
  eveningPeakWatts: number,
): (t: number) => number {
  const morningBump = gaussian(8 / 24, 1.5 / 24)  // 8am centre, ≈3h spread
  const eveningBump = gaussian(19 / 24, 2 / 24)   // 7pm centre, ≈4h spread
  return (t: number) =>
    overnightWatts + morningPeakWatts * morningBump(t) + eveningPeakWatts * eveningBump(t)
}

/**
 * Wraps a base home profile and adds a constant EV charge load during
 * [startT, endT).  Use two stacked calls to model a window that spans midnight.
 */
export function withEvChargingWindow(
  base: (t: number) => number,
  evChargeWatts: number,
  startT: number,
  endT: number,
): (t: number) => number {
  return (t: number) => base(t) + (t >= startT && t < endT ? evChargeWatts : 0)
}

/** Returns the same tariff rates for all times of day. */
export function flatTariff(
  importRate: number,
  exportRate: number,
  currency = 'GBP',
): (t: number) => TariffState {
  const tariff: TariffState = { importRate, exportRate, currency }
  return () => tariff
}

/**
 * Returns a cheap import rate during [cheapStartT, cheapEndT) and the peak
 * rate outside that window.  Useful for time-of-use and overnight tariffs.
 * To model a window that spans midnight, use (t >= cheapStartT || t < cheapEndT).
 */
export function touTariff(
  cheapImportRate: number,
  peakImportRate: number,
  exportRate: number,
  isCheap: (t: number) => boolean,
  currency = 'GBP',
): (t: number) => TariffState {
  return (t: number) => ({
    importRate: isCheap(t) ? cheapImportRate : peakImportRate,
    exportRate,
    currency,
  })
}
