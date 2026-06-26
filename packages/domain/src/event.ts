import type { EnergySnapshot } from './energy.js'

/**
 * Identifies the type of state transition an event records.
 *
 * Events mark the moment a significant change was detected by comparing
 * consecutive EnergySnapshots. Each type corresponds to a boundary crossing
 * in the home's energy system.
 *
 * - `solar_generation_started`     Solar array began producing power.
 * - `solar_generation_stopped`     Solar array stopped producing power.
 * - `battery_charging_started`     Battery began accepting charge.
 * - `battery_charging_stopped`     Battery stopped charging.
 * - `battery_discharging_started`  Battery began supplying power to the home.
 * - `battery_discharging_stopped`  Battery stopped discharging.
 * - `battery_full`                 Battery reached 100% state of charge.
 * - `battery_empty`                Battery reached its minimum state of charge.
 * - `grid_import_started`          Home began drawing power from the grid.
 * - `grid_import_stopped`          Home stopped drawing power from the grid.
 * - `grid_export_started`          Home began exporting surplus power to the grid.
 * - `grid_export_stopped`          Home stopped exporting power to the grid.
 */
export type EnergyEventType =
  | 'solar_generation_started'
  | 'solar_generation_stopped'
  | 'battery_charging_started'
  | 'battery_charging_stopped'
  | 'battery_discharging_started'
  | 'battery_discharging_stopped'
  | 'battery_full'
  | 'battery_empty'
  | 'grid_import_started'
  | 'grid_import_stopped'
  | 'grid_export_started'
  | 'grid_export_stopped'

/**
 * Records a significant state transition in the home's energy system.
 *
 * An EnergyEvent answers "what happened and when?" An EnergySnapshot answers
 * "what is happening right now?" Events are derived by comparing consecutive
 * snapshots and detecting boundary crossings.
 *
 * The full EnergySnapshot at the moment of the transition is included so that
 * consumers — timeline views, notifications, AI narrative generation — have
 * complete context without needing to correlate with external data.
 *
 * Example: a `battery_charging_started` event includes the snapshot from that
 * moment, from which consumers can read the solar output, grid state, and
 * initial battery SOC at the time charging began.
 */
export interface EnergyEvent {
  /**
   * A unique identifier for this event instance.
   * Stable within a session; suitable for use as a list key.
   */
  readonly id: string

  /**
   * The type of state transition this event records.
   */
  readonly type: EnergyEventType

  /**
   * When this transition was detected.
   *
   * Derived from the snapshot's timestamp, so it reflects when the energy
   * state was observed rather than when the event object was constructed.
   */
  readonly timestamp: Date

  /**
   * The complete energy state at the moment this event was detected.
   *
   * Provides full context for the transition: what was solar generating, what
   * was the battery SOC, was the grid active — all at the exact moment the
   * event fired. This makes events self-contained for narrative generation,
   * timeline rendering, and future AI summarisation.
   */
  readonly snapshot: EnergySnapshot
}
