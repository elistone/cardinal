import type { EnergySnapshot, SolarState, BatteryState, GridState, HomeState, TariffState, DailySummary } from '@cardinal/domain'
import type { HassState } from './types.js'

// ── Primitive parsers ─────────────────────────────────────────────────────────

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

function parseKwh(state: HassState | undefined): number {
  if (!state) return 0
  const value = parseFloat(state.state)
  return isNaN(value) ? 0 : Math.max(0, value)
}

function parseRate(state: HassState | undefined): number | null {
  if (!state) return null
  const value = parseFloat(state.state)
  return isNaN(value) ? null : value
}

// ── Concept translators ───────────────────────────────────────────────────────

function translateSolarState(powerState: HassState | undefined): SolarState {
  const generatingWatts = Math.max(0, parseWatts(powerState))
  return {
    generatingWatts,
    isGenerating: generatingWatts > 0,
  }
}

function translateBatteryState(options: {
  // Whether the user configured separate charge/discharge sensors — determined
  // from the entity mapping, not from whether a state has arrived.  This
  // distinction matters: a configured entity that is temporarily unavailable
  // must not silently fall through to the signed-sensor fallback.
  useSeparateSensors: boolean
  powerState?: HassState
  chargePowerState?: HassState
  dischargePowerState?: HassState
  socState?: HassState
}): BatteryState {
  let chargingWatts: number
  let dischargingWatts: number

  if (options.useSeparateSensors) {
    // Separate charge/discharge sensors (preferred; e.g. LuxPower, GivEnergy, FoxESS, Solis).
    chargingWatts = Math.max(0, parseWatts(options.chargePowerState))
    dischargingWatts = Math.max(0, parseWatts(options.dischargePowerState))
  } else {
    // Single signed sensor: positive = charging, negative = discharging.
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
  // Whether the user configured separate import/export sensors — determined
  // from the entity mapping, not from whether a state has arrived.
  useSeparateSensors: boolean
  powerState?: HassState
  importPowerState?: HassState
  exportPowerState?: HassState
}): GridState {
  let importingWatts: number
  let exportingWatts: number

  if (options.useSeparateSensors) {
    // Separate import/export sensors (preferred; e.g. LuxPower Modbus meters).
    importingWatts = Math.max(0, parseWatts(options.importPowerState))
    exportingWatts = Math.max(0, parseWatts(options.exportPowerState))
  } else {
    // Single signed sensor: positive = importing, negative = exporting.
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

function translateTariffState(options: {
  importRateState?: HassState
  exportRateState?: HassState
  currency: string
}): TariffState {
  return {
    importRate: parseRate(options.importRateState),
    exportRate: parseRate(options.exportRateState),
    currency: options.currency,
  }
}

// ── Public translators ────────────────────────────────────────────────────────

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
    importRate?: string
    exportRate?: string
    currency?: string
  },
): EnergySnapshot {
  return {
    timestamp: new Date(),
    solar: translateSolarState(
      mapping.solarPower ? states[mapping.solarPower] : undefined,
    ),
    battery: translateBatteryState({
      useSeparateSensors: !!(mapping.batteryChargePower || mapping.batteryDischargePower),
      powerState: mapping.batteryPower ? states[mapping.batteryPower] : undefined,
      chargePowerState: mapping.batteryChargePower ? states[mapping.batteryChargePower] : undefined,
      dischargePowerState: mapping.batteryDischargePower ? states[mapping.batteryDischargePower] : undefined,
      socState: mapping.batteryStateOfCharge ? states[mapping.batteryStateOfCharge] : undefined,
    }),
    grid: translateGridState({
      useSeparateSensors: !!(mapping.gridImportPower || mapping.gridExportPower),
      powerState: mapping.gridPower ? states[mapping.gridPower] : undefined,
      importPowerState: mapping.gridImportPower ? states[mapping.gridImportPower] : undefined,
      exportPowerState: mapping.gridExportPower ? states[mapping.gridExportPower] : undefined,
    }),
    home: translateHomeState(
      mapping.homeConsumption ? states[mapping.homeConsumption] : undefined,
    ),
    tariffs: translateTariffState({
      importRateState: mapping.importRate ? states[mapping.importRate] : undefined,
      exportRateState: mapping.exportRate ? states[mapping.exportRate] : undefined,
      currency: mapping.currency ?? 'GBP',
    }),
  }
}

export function translateDailySummary(
  states: Record<string, HassState>,
  mapping: {
    solarGeneratedToday?: string
    batteryChargedToday?: string
    batteryDischargedToday?: string
    gridImportedToday?: string
    gridExportedToday?: string
    homeConsumedToday?: string
  },
): DailySummary {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return {
    date: today,
    solar: {
      generatedKwh: parseKwh(mapping.solarGeneratedToday ? states[mapping.solarGeneratedToday] : undefined),
    },
    battery: {
      chargedKwh: parseKwh(mapping.batteryChargedToday ? states[mapping.batteryChargedToday] : undefined),
      dischargedKwh: parseKwh(mapping.batteryDischargedToday ? states[mapping.batteryDischargedToday] : undefined),
    },
    grid: {
      importedKwh: parseKwh(mapping.gridImportedToday ? states[mapping.gridImportedToday] : undefined),
      exportedKwh: parseKwh(mapping.gridExportedToday ? states[mapping.gridExportedToday] : undefined),
    },
    home: {
      consumedKwh: parseKwh(mapping.homeConsumedToday ? states[mapping.homeConsumedToday] : undefined),
    },
  }
}
