/**
 * The current state of the solar array.
 */
export interface SolarState {
  /** Current generation in watts. Always ≥ 0. */
  readonly generatingWatts: number
  /** True when the array is actively producing power. */
  readonly isGenerating: boolean
}

/**
 * The current state of the home battery system.
 *
 * Power values are always ≥ 0. Direction is expressed through the
 * isCharging / isDischarging / isIdle flags and separate watt fields,
 * which maps naturally to hardware that exposes separate charge and
 * discharge sensors (e.g. LuxPower Modbus).
 */
export interface BatteryState {
  /** State of charge expressed as a percentage, 0–100. */
  readonly chargePercent: number
  /** Power flowing into the battery in watts. Greater than 0 when charging, 0 otherwise. */
  readonly chargingWatts: number
  /** Power flowing out of the battery in watts. Greater than 0 when discharging, 0 otherwise. */
  readonly dischargingWatts: number
  /** True when the battery is actively receiving charge. */
  readonly isCharging: boolean
  /** True when the battery is supplying power to the home or grid. */
  readonly isDischarging: boolean
  /** True when no power is flowing in either direction. */
  readonly isIdle: boolean
}

/**
 * The current state of the grid connection.
 *
 * Power values are always ≥ 0. Direction is expressed through separate
 * importingWatts / exportingWatts fields and corresponding flags, which
 * maps naturally to hardware that exposes separate import and export sensors.
 * A home cannot simultaneously import and export in normal operation.
 */
export interface GridState {
  /** Power being drawn from the grid in watts. Greater than 0 when importing, 0 otherwise. */
  readonly importingWatts: number
  /** Power being sent to the grid in watts. Greater than 0 when exporting, 0 otherwise. */
  readonly exportingWatts: number
  /** True when the home is drawing power from the grid. */
  readonly isImporting: boolean
  /** True when surplus power is being sent to the grid. */
  readonly isExporting: boolean
  /** True when there is no power flow to or from the grid. */
  readonly isIdle: boolean
}

/**
 * The current state of energy consumption within the home.
 */
export interface HomeState {
  /** Total power currently being consumed by the home in watts. Always ≥ 0. */
  readonly consumingWatts: number
}

/**
 * The current electricity tariff rates, sourced from a tariff integration such
 * as Octopus Energy.  Rates are null when the corresponding sensor has not been
 * configured or has not yet reported a value.
 *
 * Cardinal treats rates as live data because dynamic tariffs (e.g. Octopus
 * Agile) change throughout the day.
 */
export interface TariffState {
  /** Current import price per kWh, in the configured currency. Null when unavailable. */
  readonly importRate: number | null
  /** Current export price per kWh, in the configured currency. Null when unavailable. */
  readonly exportRate: number | null
  /** ISO 4217 currency code. */
  readonly currency: string
}

/**
 * A point-in-time snapshot of the home's complete energy system.
 *
 * This is the primary live data model in Cardinal. Providers produce it on
 * each state change; Pinia stores hold the latest value; packages/core
 * derives insights and calculations from it.
 *
 * All values represent the instantaneous state at the recorded timestamp.
 * For accumulated totals (kWh over the day), see DailySummary.
 */
export interface EnergySnapshot {
  /** When this snapshot was captured. */
  readonly timestamp: Date
  /** Current state of the solar array. */
  readonly solar: SolarState
  /** Current state of the home battery system. */
  readonly battery: BatteryState
  /** Current state of the grid connection. */
  readonly grid: GridState
  /** Current state of home energy consumption. */
  readonly home: HomeState
  /** Current electricity tariff rates. Always present; individual rates are null when unconfigured. */
  readonly tariffs: TariffState
}
