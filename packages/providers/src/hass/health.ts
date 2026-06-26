import type { ConfigurationHealth, ConceptHealth } from '@cardinal/domain'
import type { HassEntityMapping, HassState } from './types.js'

const UNAVAILABLE_STATES = new Set(['unavailable', 'unknown'])

function assessConcept(
  states: Record<string, HassState>,
  entityId: string | undefined,
): ConceptHealth {
  if (!entityId) return { status: 'missing' }
  const hassState = states[entityId]
  if (!hassState || UNAVAILABLE_STATES.has(hassState.state)) {
    return { status: 'unavailable', entityId }
  }
  if (isNaN(parseFloat(hassState.state))) {
    return { status: 'invalid', entityId }
  }
  return { status: 'configured', entityId }
}

// For dual-convention sensors (separate vs. signed), the separate sensor takes
// precedence when configured. If only the signed sensor is present, both the
// positive (charge/import) and negative (discharge/export) concepts share it.
function assessDualConvention(
  states: Record<string, HassState>,
  separateId: string | undefined,
  signedId: string | undefined,
): ConceptHealth {
  if (separateId) return assessConcept(states, separateId)
  return assessConcept(states, signedId)
}

export function assessConfigurationHealth(
  states: Record<string, HassState>,
  mapping: HassEntityMapping,
): ConfigurationHealth {
  return {
    live: {
      solar: assessConcept(states, mapping.solarPower),
      batteryCharging: assessDualConvention(states, mapping.batteryChargePower, mapping.batteryPower),
      batteryDischarging: assessDualConvention(states, mapping.batteryDischargePower, mapping.batteryPower),
      batteryLevel: assessConcept(states, mapping.batteryStateOfCharge),
      gridImport: assessDualConvention(states, mapping.gridImportPower, mapping.gridPower),
      gridExport: assessDualConvention(states, mapping.gridExportPower, mapping.gridPower),
      homeConsumption: assessConcept(states, mapping.homeConsumption),
    },
    daily: {
      solarGenerated: assessConcept(states, mapping.solarGeneratedToday),
      batteryCharged: assessConcept(states, mapping.batteryChargedToday),
      batteryDischarged: assessConcept(states, mapping.batteryDischargedToday),
      gridImported: assessConcept(states, mapping.gridImportedToday),
      gridExported: assessConcept(states, mapping.gridExportedToday),
      homeConsumed: assessConcept(states, mapping.homeConsumedToday),
    },
  }
}
