/**
 * Describes the health status of a single configured sensor.
 *
 * - configured:  An entity ID is set and the current value is numeric and valid.
 * - missing:     No entity ID has been configured for this concept.
 * - unavailable: An entity ID is configured but Home Assistant is reporting the
 *                entity as unavailable or unknown.
 * - invalid:     An entity ID is configured and the entity is present, but its
 *                current state is not a recognisable numeric value.
 */
export type SensorHealthStatus = 'configured' | 'missing' | 'unavailable' | 'invalid'

/**
 * Health status for a single energy concept (e.g. "solar power", "grid import").
 */
export interface ConceptHealth {
  readonly status: SensorHealthStatus
  /** The entity ID being used for this concept. Undefined when status is 'missing'. */
  readonly entityId?: string
  /** Current numeric value reported by the entity. Null when unavailable or missing. */
  readonly value?: number | null
  /** Unit of measurement (e.g. "W", "kWh", "%"). Null when unavailable or missing. */
  readonly unit?: string | null
}

/**
 * Health status for all live (instantaneous power) sensor concepts.
 */
export interface LiveHealth {
  readonly solar: ConceptHealth
  readonly batteryCharging: ConceptHealth
  readonly batteryDischarging: ConceptHealth
  readonly batteryLevel: ConceptHealth
  readonly gridImport: ConceptHealth
  readonly gridExport: ConceptHealth
  readonly homeConsumption: ConceptHealth
}

/**
 * Health status for all daily energy accumulation sensor concepts.
 */
export interface DailyHealth {
  readonly solarGenerated: ConceptHealth
  readonly batteryCharged: ConceptHealth
  readonly batteryDischarged: ConceptHealth
  readonly gridImported: ConceptHealth
  readonly gridExported: ConceptHealth
  readonly homeConsumed: ConceptHealth
}

/**
 * A complete snapshot of Cardinal's configuration health.
 *
 * Consumers can use this to explain to the user why data is missing or
 * inaccurate rather than silently displaying zeros or placeholders.
 */
export interface ConfigurationHealth {
  readonly live: LiveHealth
  readonly daily: DailyHealth
}
