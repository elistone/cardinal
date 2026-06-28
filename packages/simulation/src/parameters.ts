import type { SimulationScenario } from './types.js'
import {
  solarBell,
  standardHomeProfile,
  withEvChargingWindow,
  flatTariff,
  touTariff,
} from './profiles.js'

// ─── Solar ────────────────────────────────────────────────────────────────────

export interface SolarParameters {
  /** Peak output in watts under clear-sky conditions at solar noon. */
  readonly peakWatts: number
  /** Time the sun rises above generation threshold, in decimal hours (e.g. 5.25 = 05:15). */
  readonly sunriseHour: number
  /** Time the sun falls below generation threshold, in decimal hours (e.g. 20.5 = 20:30). */
  readonly sunsetHour: number
}

// ─── Home ─────────────────────────────────────────────────────────────────────

export interface EvChargingParameters {
  /** Charge rate in watts (e.g. 7200 for a 7.2 kW home charger). */
  readonly chargeRateWatts: number
  /**
   * Start of the charging window in decimal hours.
   * May be greater than endHour for windows that span midnight
   * (e.g. startHour: 23.5, endHour: 7 means 23:30–07:00).
   */
  readonly startHour: number
  /** End of the charging window in decimal hours. */
  readonly endHour: number
}

export interface HomeLoadParameters {
  /** Constant background load in watts (appliances on standby, fridge, router, etc.). */
  readonly overnightWatts: number
  /** Additional morning activity peak in watts, above overnight base. */
  readonly morningPeakWatts: number
  /** Hour of day at which the morning peak centres (e.g. 8 = 08:00). */
  readonly morningPeakHour: number
  /** Additional evening activity peak in watts, above overnight base. */
  readonly eveningPeakWatts: number
  /** Hour of day at which the evening peak centres (e.g. 19 = 19:00). */
  readonly eveningPeakHour: number
  /** Optional EV charging window. */
  readonly ev?: EvChargingParameters
}

// ─── Battery ─────────────────────────────────────────────────────────────────

export interface BatteryParameters {
  readonly capacityKwh: number
  /** State of charge at the start of the day, 0–100. May be overridden by DayState when chaining days. */
  readonly initialChargePercent: number
  readonly maxChargeRateWatts: number
  readonly maxDischargeRateWatts: number
  /** Fraction of charge input that is stored (0–1). Discharge is assumed lossless. */
  readonly efficiency: number
}

// ─── Tariffs ──────────────────────────────────────────────────────────────────

export type TariffParameters =
  | {
      readonly kind: 'flat'
      readonly importRate: number
      readonly exportRate: number
      readonly currency?: string
    }
  | {
      readonly kind: 'tou'
      readonly cheapRate: number
      readonly peakRate: number
      readonly exportRate: number
      /**
       * Start of the cheap window in decimal hours.
       * May be greater than cheapEndHour for overnight windows (e.g. 23.5 for 23:30).
       */
      readonly cheapStartHour: number
      /** End of the cheap window in decimal hours. */
      readonly cheapEndHour: number
      readonly currency?: string
    }

// ─── Grid charge ──────────────────────────────────────────────────────────────

export interface GridChargeParameters {
  /** Start of the grid-charge window in decimal hours. */
  readonly startHour: number
  /** End of the grid-charge window in decimal hours. */
  readonly endHour: number
  readonly chargeRateWatts: number
}

// ─── Scenario ─────────────────────────────────────────────────────────────────

/**
 * A serialisable, plain-data description of a simulation scenario.
 *
 * `ScenarioParameters` can be stored as JSON, transmitted over a network,
 * persisted to a database, embedded in a URL, or written in documentation —
 * without any JavaScript function references.
 *
 * Use `buildScenarioFromParameters(params)` to convert parameters into a
 * `SimulationScenario` that the engine can execute.
 *
 * All hours are in the local day's decimal time (0 = midnight, 12 = noon,
 * 23.5 = 23:30).  Hours are not converted to UTC.  The engine operates in
 * local time for the date passed to `buildDay()`.
 */
export interface ScenarioParameters {
  readonly id: string
  readonly name: string
  readonly description: string
  readonly solar: SolarParameters
  readonly home: HomeLoadParameters
  readonly battery: BatteryParameters
  readonly tariffs: TariffParameters
  readonly gridChargeWindows?: ReadonlyArray<GridChargeParameters>
}

// ─── Factory ──────────────────────────────────────────────────────────────────

function hoursToT(hours: number): number {
  return hours / 24
}

/**
 * Converts a `ScenarioParameters` object into a `SimulationScenario` that
 * the engine can execute.
 *
 * This is the bridge between serialisable data (parameters) and the
 * function-based `SimulationScenario` interface.  The split exists so that
 * scenarios can be stored and transmitted as plain data while the engine
 * still operates on functions.
 */
export function buildScenarioFromParameters(params: ScenarioParameters): SimulationScenario {
  const sunriseT = hoursToT(params.solar.sunriseHour)
  const sunsetT = hoursToT(params.solar.sunsetHour)
  const solar = solarBell(params.solar.peakWatts, sunriseT, sunsetT)

  let home = standardHomeProfile(
    params.home.overnightWatts,
    params.home.morningPeakWatts,
    params.home.eveningPeakWatts,
  )

  // If the home profile centre hours differ from the defaults (08:00/19:00), we
  // need to rebuild using the provided hours.  The standard profile helper hard-
  // codes the peak hours, so we need a more general approach for overrides.
  // For now, validate that callers using the defaults don't incur unexpected
  // behaviour — this will be generalised when HomeLoadParameters gains
  // explicit peak-hour support in the profile helpers.
  // TODO: expose peakHour parameters in standardHomeProfile().

  if (params.home.ev !== undefined) {
    const ev = params.home.ev
    const evStartT = hoursToT(ev.startHour)
    const evEndT = hoursToT(ev.endHour)

    if (ev.startHour <= ev.endHour) {
      // Simple window within the same day
      home = withEvChargingWindow(home, ev.chargeRateWatts, evStartT, evEndT)
    } else {
      // Overnight window that spans midnight: e.g. 23:30 → 07:00
      // Split into two windows: [start → midnight) and [midnight → end)
      home = withEvChargingWindow(
        withEvChargingWindow(home, ev.chargeRateWatts, 0, evEndT),
        ev.chargeRateWatts,
        evStartT,
        1,
      )
    }
  }

  let tariffs: SimulationScenario['tariffs']
  if (params.tariffs.kind === 'flat') {
    tariffs = flatTariff(
      params.tariffs.importRate,
      params.tariffs.exportRate,
      params.tariffs.currency ?? 'GBP',
    )
  } else {
    const cheapStart = hoursToT(params.tariffs.cheapStartHour)
    const cheapEnd = hoursToT(params.tariffs.cheapEndHour)
    const isCheap =
      params.tariffs.cheapStartHour <= params.tariffs.cheapEndHour
        ? (t: number) => t >= cheapStart && t < cheapEnd
        : (t: number) => t >= cheapStart || t < cheapEnd  // spans midnight
    tariffs = touTariff(
      params.tariffs.cheapRate,
      params.tariffs.peakRate,
      params.tariffs.exportRate,
      isCheap,
      params.tariffs.currency ?? 'GBP',
    )
  }

  const gridChargeWindows = params.gridChargeWindows?.map(w => ({
    startT: hoursToT(w.startHour),
    endT: hoursToT(w.endHour),
    chargeRateWatts: w.chargeRateWatts,
  }))

  return {
    id: params.id,
    name: params.name,
    description: params.description,
    battery: {
      capacityKwh: params.battery.capacityKwh,
      initialChargePercent: params.battery.initialChargePercent,
      maxChargeRateWatts: params.battery.maxChargeRateWatts,
      maxDischargeRateWatts: params.battery.maxDischargeRateWatts,
      efficiency: params.battery.efficiency,
    },
    solarProfile: solar,
    homeProfile: home,
    tariffs,
    gridChargeWindows,
  }
}
