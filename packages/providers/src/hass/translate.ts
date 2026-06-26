import type { EnergySnapshot, SolarState, BatteryState, GridState, HomeState } from '@cardinal/domain'
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

function translateSolarState(powerState: HassState | undefined): SolarState {
  const generatingWatts = Math.max(0, parseWatts(powerState))
  return {
    generatingWatts,
    isGenerating: generatingWatts > 0,
  }
}

function translateBatteryState(options: {
  powerState?: HassState
  chargePowerState?: HassState
  dischargePowerState?: HassState
  socState?: HassState
}): BatteryState {
  let chargingWatts: number
  let dischargingWatts: number

  if (options.chargePowerState !== undefined || options.dischargePowerState !== undefined) {
    // Separate charge/discharge sensors (e.g. LuxPower Modbus).
    chargingWatts = Math.max(0, parseWatts(options.chargePowerState))
    dischargingWatts = Math.max(0, parseWatts(options.dischargePowerState))
  } else {
    // Single sensor: positive = charging, negative = discharging.
    const net = parseWatts(options.powerState)
    chargingWatts = net > 0 ? net : 0
    dischargingWatts = net < 0 ? Math.abs(net) : 0
  }

  return {
    chargePercent: parseSoc(options.socState),
    chargingWatts,
    dischargingWatts,
    isCharging: chargingWatts > 0,
    isDischarging: dischargingWatts > 0,
    isIdle: chargingWatts === 0 && dischargingWatts === 0,
  }
}

function translateGridState(options: {
  powerState?: HassState
  importPowerState?: HassState
  exportPowerState?: HassState
}): GridState {
  let importingWatts: number
  let exportingWatts: number

  if (options.importPowerState !== undefined || options.exportPowerState !== undefined) {
    // Separate import/export sensors (e.g. LuxPower Modbus).
    importingWatts = Math.max(0, parseWatts(options.importPowerState))
    exportingWatts = Math.max(0, parseWatts(options.exportPowerState))
  } else {
    // Single sensor: positive = importing, negative = exporting.
    const net = parseWatts(options.powerState)
    importingWatts = net > 0 ? net : 0
    exportingWatts = net < 0 ? Math.abs(net) : 0
  }

  return {
    importingWatts,
    exportingWatts,
    isImporting: importingWatts > 0,
    isExporting: exportingWatts > 0,
    isIdle: importingWatts === 0 && exportingWatts === 0,
  }
}

function translateHomeState(powerState: HassState | undefined): HomeState {
  return {
    consumingWatts: Math.max(0, parseWatts(powerState)),
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
    solar: translateSolarState(
      mapping.solarPower ? states[mapping.solarPower] : undefined,
    ),
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
    home: translateHomeState(
      mapping.homeConsumption ? states[mapping.homeConsumption] : undefined,
    ),
  }
}
