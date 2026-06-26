import type { EnergySnapshot, BatteryState, GridState } from '@cardinal/domain'
import type { HassState } from './types.js'

function parseWatts(state: HassState | undefined): number {
  if (!state) return 0
  const value = parseFloat(state.state)
  return isNaN(value) ? 0 : value
}

function parseSoc(state: HassState | undefined): number {
  if (!state) return 0
  const value = parseFloat(state.state)
  return isNaN(value) ? 0 : Math.min(100, Math.max(0, value))
}

export function translateBatteryState(options: {
  powerState?: HassState
  chargePowerState?: HassState
  dischargePowerState?: HassState
  socState?: HassState
}): BatteryState {
  let watts: number

  if (options.chargePowerState !== undefined || options.dischargePowerState !== undefined) {
    // Separate charge/discharge sensors (e.g. LuxPower Modbus).
    // Net watts: positive = charging, negative = discharging.
    watts = parseWatts(options.chargePowerState) - parseWatts(options.dischargePowerState)
  } else {
    // Single sensor with sign convention: positive = charging, negative = discharging.
    watts = parseWatts(options.powerState)
  }

  return {
    power: { watts },
    stateOfCharge: parseSoc(options.socState),
    isCharging: watts > 0,
    isDischarging: watts < 0,
    isIdle: watts === 0,
  }
}

export function translateGridState(options: {
  powerState?: HassState
  importPowerState?: HassState
  exportPowerState?: HassState
}): GridState {
  if (options.importPowerState !== undefined || options.exportPowerState !== undefined) {
    // Separate import/export sensors (e.g. LuxPower Modbus).
    const importWatts = parseWatts(options.importPowerState)
    const exportWatts = parseWatts(options.exportPowerState)
    return {
      power: { watts: importWatts > 0 ? importWatts : exportWatts },
      isImporting: importWatts > 0,
      isExporting: exportWatts > 0,
    }
  }

  // Single sensor: positive = importing, negative = exporting.
  const watts = parseWatts(options.powerState)
  return {
    power: { watts: Math.abs(watts) },
    isImporting: watts > 0,
    isExporting: watts < 0,
  }
}

export function translateEnergySnapshot(
  states: Record<string, HassState>,
  mapping: {
    solarPower?: string
    batteryPower?: string
    batteryChargePower?: string
    batteryDischargePower?: string
    batteryStateOfCharge?: string
    gridPower?: string
    gridImportPower?: string
    gridExportPower?: string
    homeConsumption?: string
  },
): EnergySnapshot {
  return {
    timestamp: new Date(),
    solar: { watts: parseWatts(mapping.solarPower ? states[mapping.solarPower] : undefined) },
    battery: translateBatteryState({
      powerState: mapping.batteryPower ? states[mapping.batteryPower] : undefined,
      chargePowerState: mapping.batteryChargePower ? states[mapping.batteryChargePower] : undefined,
      dischargePowerState: mapping.batteryDischargePower ? states[mapping.batteryDischargePower] : undefined,
      socState: mapping.batteryStateOfCharge ? states[mapping.batteryStateOfCharge] : undefined,
    }),
    grid: translateGridState({
      powerState: mapping.gridPower ? states[mapping.gridPower] : undefined,
      importPowerState: mapping.gridImportPower ? states[mapping.gridImportPower] : undefined,
      exportPowerState: mapping.gridExportPower ? states[mapping.gridExportPower] : undefined,
    }),
    home: { watts: parseWatts(mapping.homeConsumption ? states[mapping.homeConsumption] : undefined) },
  }
}
