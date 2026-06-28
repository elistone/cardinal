import type { EnergySnapshot, DailySummary, TariffState } from '@cardinal/domain'

export interface SimulationBatteryConfig {
  /** Total usable capacity in kWh. */
  readonly capacityKwh: number
  /** State of charge at midnight (start of simulated day), 0–100. */
  readonly initialChargePercent: number
  /** Maximum charge rate in watts. */
  readonly maxChargeRateWatts: number
  /** Maximum discharge rate in watts. */
  readonly maxDischargeRateWatts: number
  /** Fraction of charge energy actually stored (e.g. 0.92 for 92% efficiency). */
  readonly efficiency: number
}

/** A window during which the battery is deliberately charged from the grid. */
export interface GridChargeWindow {
  /** Start of the window as fraction of day (0 = midnight, 0.25 = 06:00). */
  readonly startT: number
  /** End of the window (exclusive) as fraction of day. */
  readonly endT: number
  /** Target charge rate in watts during this window. */
  readonly chargeRateWatts: number
}

/**
 * A named simulation scenario that fully describes a single simulated day.
 *
 * Profile functions take a time-of-day fraction t ∈ [0, 1) where 0 = midnight
 * and 0.5 = noon, and return watts.  The engine calls them once per minute and
 * integrates the results into EnergySnapshot values with enforced energy balance.
 */
export interface SimulationScenario {
  readonly id: string
  readonly name: string
  readonly description: string
  readonly battery: SimulationBatteryConfig
  /** Instantaneous solar output in watts at time-of-day fraction t. */
  readonly solarProfile: (t: number) => number
  /** Instantaneous home consumption in watts at time-of-day fraction t. */
  readonly homeProfile: (t: number) => number
  /** Tariff rates in effect at time-of-day fraction t. */
  readonly tariffs: (t: number) => TariffState
  /** Optional windows during which the battery is force-charged from the grid. */
  readonly gridChargeWindows?: ReadonlyArray<GridChargeWindow>
}

/** A single pre-computed minute within a simulated day. */
export interface SimulatedPoint {
  readonly timestamp: Date
  readonly snapshot: EnergySnapshot
  /** Running energy totals from midnight to this minute. */
  readonly dailySummary: DailySummary
}

/**
 * A fully pre-computed simulated day.
 *
 * Contains 1440 SimulatedPoints (one per minute) and an at() lookup method for
 * retrieving the point whose minute contains any given timestamp.
 */
export interface SimulatedDay {
  readonly scenario: SimulationScenario
  /** Local midnight that starts this day (time components are all zero). */
  readonly date: Date
  readonly points: readonly SimulatedPoint[]
  /** Return the point for the minute that contains timestamp. Clamps to day boundaries. */
  readonly at: (timestamp: Date) => SimulatedPoint
}
