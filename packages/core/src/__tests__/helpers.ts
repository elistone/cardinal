import type {
  EnergySnapshot,
  SolarState,
  BatteryState,
  GridState,
  HomeState,
  TariffState,
} from '@cardinal/domain'

export function makeSolar(generatingWatts: number): SolarState {
  return { generatingWatts, isGenerating: generatingWatts > 0 }
}

export function makeBattery(opts: {
  chargingWatts?: number
  dischargingWatts?: number
  chargePercent?: number
} = {}): BatteryState {
  const chargingWatts = opts.chargingWatts ?? 0
  const dischargingWatts = opts.dischargingWatts ?? 0
  return {
    chargePercent: opts.chargePercent ?? 50,
    chargingWatts,
    dischargingWatts,
    isCharging: chargingWatts > 0,
    isDischarging: dischargingWatts > 0,
    isIdle: chargingWatts === 0 && dischargingWatts === 0,
  }
}

export function makeGrid(opts: {
  importingWatts?: number
  exportingWatts?: number
} = {}): GridState {
  const importingWatts = opts.importingWatts ?? 0
  const exportingWatts = opts.exportingWatts ?? 0
  return {
    importingWatts,
    exportingWatts,
    isImporting: importingWatts > 0,
    isExporting: exportingWatts > 0,
    isIdle: importingWatts === 0 && exportingWatts === 0,
  }
}

export function makeHome(consumingWatts: number): HomeState {
  return { consumingWatts }
}

export const FIXED_TIMESTAMP = new Date('2025-06-01T12:00:00Z')

export function makeSnapshot(opts: {
  solar?: SolarState
  battery?: BatteryState
  grid?: GridState
  home?: HomeState
  tariffs?: TariffState
  timestamp?: Date
} = {}): EnergySnapshot {
  return {
    timestamp: opts.timestamp ?? FIXED_TIMESTAMP,
    solar: opts.solar ?? makeSolar(0),
    battery: opts.battery ?? makeBattery(),
    grid: opts.grid ?? makeGrid(),
    home: opts.home ?? makeHome(1000),
    tariffs: opts.tariffs ?? { importRate: null, exportRate: null, currency: 'GBP' },
  }
}
