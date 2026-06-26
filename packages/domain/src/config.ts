/**
 * Maps Cardinal's energy concepts to the Home Assistant entity IDs configured
 * for a specific installation.
 *
 * Each field is optional because not every installation will have every sensor.
 * Cardinal degrades gracefully when sensors are absent, surfacing explanatory
 * messages rather than errors.
 *
 * Battery and grid fields support two wiring conventions:
 * - Single signed sensor (positive = charging/importing, negative = discharging/exporting)
 * - Separate sensors for each direction (always ≥ 0), as used by LuxPower Modbus
 *
 * If both forms are supplied, the separate-sensor form takes precedence.
 */
export interface EntityMapping {
  /** Entity ID of the solar power sensor (watts). */
  readonly solarPower?: string

  /**
   * Entity ID of a single battery power sensor (watts, signed).
   * Positive values indicate charging; negative values indicate discharging.
   * Use batteryChargePower and batteryDischargePower instead for hardware
   * that exposes separate sensors.
   */
  readonly batteryPower?: string

  /**
   * Entity ID of the battery charge power sensor (watts, always ≥ 0).
   * Used when the inverter exposes charging and discharging as separate sensors.
   */
  readonly batteryChargePower?: string

  /**
   * Entity ID of the battery discharge power sensor (watts, always ≥ 0).
   * Used when the inverter exposes charging and discharging as separate sensors.
   */
  readonly batteryDischargePower?: string

  /** Entity ID of the battery state-of-charge sensor (percentage, 0–100). */
  readonly batteryStateOfCharge?: string

  /**
   * Entity ID of a single grid power sensor (watts, signed).
   * Positive values indicate importing; negative values indicate exporting.
   * Use gridImportPower and gridExportPower instead for hardware that exposes
   * separate sensors.
   */
  readonly gridPower?: string

  /**
   * Entity ID of the grid import power sensor (watts, always ≥ 0).
   * Used when the meter exposes import and export as separate sensors.
   */
  readonly gridImportPower?: string

  /**
   * Entity ID of the grid export power sensor (watts, always ≥ 0).
   * Used when the meter exposes import and export as separate sensors.
   */
  readonly gridExportPower?: string

  /** Entity ID of the home consumption power sensor (watts). */
  readonly homeConsumption?: string

  /**
   * Entity ID or fixed numeric string for the electricity import tariff rate.
   * Expected unit: currency per kWh (e.g. £/kWh).
   */
  readonly importRate?: string

  /**
   * Entity ID or fixed numeric string for the electricity export tariff rate.
   * Expected unit: currency per kWh (e.g. £/kWh).
   */
  readonly exportRate?: string

  /**
   * ISO 4217 currency code for all financial calculations.
   * @example 'GBP'
   */
  readonly currency?: string
}
