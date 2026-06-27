import type {
  EnergyProvider,
  SnapshotCallback,
  DailySummaryCallback,
  HealthCallback,
  ConnectionStatusCallback,
} from '@cardinal/providers'
import type { EnergySnapshot, ConfigurationHealth, DailySummary } from '@cardinal/domain'

// ─── Static mock data ─────────────────────────────────────────────────────────

const HEALTH: ConfigurationHealth = {
  live: {
    solar:              { status: 'configured', entityId: 'sensor.pv_power' },
    batteryCharging:    { status: 'configured', entityId: 'sensor.battery_charge_power' },
    batteryDischarging: { status: 'configured', entityId: 'sensor.battery_discharge_power' },
    batteryLevel:       { status: 'configured', entityId: 'sensor.battery_soc' },
    gridImport:         { status: 'configured', entityId: 'sensor.power_from_grid' },
    gridExport:         { status: 'configured', entityId: 'sensor.power_to_grid' },
    homeConsumption:    { status: 'configured', entityId: 'sensor.load_power' },
  },
  daily: {
    solarGenerated:    { status: 'configured', entityId: 'sensor.solar_energy_today' },
    batteryCharged:    { status: 'configured', entityId: 'sensor.battery_charged_today' },
    batteryDischarged: { status: 'configured', entityId: 'sensor.battery_discharged_today' },
    gridImported:      { status: 'configured', entityId: 'sensor.grid_imported_today' },
    gridExported:      { status: 'configured', entityId: 'sensor.grid_exported_today' },
    homeConsumed:      { status: 'configured', entityId: 'sensor.home_consumed_today' },
  },
}

const DAILY_SUMMARY: DailySummary = {
  date: new Date(),
  solar:   { generatedKwh: 18.4 },
  battery: { chargedKwh: 8.2, dischargedKwh: 5.1 },
  grid:    { importedKwh: 1.2, exportedKwh: 6.3 },
  home:    { consumedKwh: 12.1 },
}

const SCENARIOS: Omit<EnergySnapshot, 'timestamp'>[] = [
  {
    solar:   { generatingWatts: 3600, isGenerating: true },
    battery: { chargePercent: 68, chargingWatts: 1800, dischargingWatts: 0, isCharging: true, isDischarging: false, isIdle: false },
    grid:    { importingWatts: 0, exportingWatts: 800, isImporting: false, isExporting: true, isIdle: false },
    home:    { consumingWatts: 1000 },
    tariffs: { importRate: 0.245, exportRate: 0.15, currency: 'GBP' },
  },
  {
    solar:   { generatingWatts: 4800, isGenerating: true },
    battery: { chargePercent: 100, chargingWatts: 0, dischargingWatts: 0, isCharging: false, isDischarging: false, isIdle: true },
    grid:    { importingWatts: 0, exportingWatts: 3300, isImporting: false, isExporting: true, isIdle: false },
    home:    { consumingWatts: 1500 },
    tariffs: { importRate: 0.245, exportRate: 0.15, currency: 'GBP' },
  },
  {
    solar:   { generatingWatts: 0, isGenerating: false },
    battery: { chargePercent: 82, chargingWatts: 0, dischargingWatts: 2200, isCharging: false, isDischarging: true, isIdle: false },
    grid:    { importingWatts: 0, exportingWatts: 0, isImporting: false, isExporting: false, isIdle: true },
    home:    { consumingWatts: 2200 },
    tariffs: { importRate: 0.245, exportRate: 0.15, currency: 'GBP' },
  },
  {
    solar:   { generatingWatts: 0, isGenerating: false },
    battery: { chargePercent: 42, chargingWatts: 0, dischargingWatts: 0, isCharging: false, isDischarging: false, isIdle: true },
    grid:    { importingWatts: 1100, exportingWatts: 0, isImporting: true, isExporting: false, isIdle: false },
    home:    { consumingWatts: 1100 },
    tariffs: { importRate: 0.245, exportRate: 0.15, currency: 'GBP' },
  },
]

const CYCLE_INTERVAL_MS = 5000

// ─── Provider ─────────────────────────────────────────────────────────────────

export class MockEnergyProvider implements EnergyProvider {
  private snapshotCallbacks: SnapshotCallback[] = []
  private dailyCallbacks: DailySummaryCallback[] = []
  private healthCallbacks: HealthCallback[] = []
  private statusCallbacks: ConnectionStatusCallback[] = []
  private timer: ReturnType<typeof setInterval> | null = null
  private scenarioIndex = 0

  private currentSnapshot(): EnergySnapshot {
    // scenarioIndex is always in-bounds (maintained by modulo in the interval),
    // but noUncheckedIndexedAccess requires an explicit assertion.
    return { ...SCENARIOS[this.scenarioIndex]!, timestamp: new Date() }
  }

  onSnapshot(cb: SnapshotCallback): () => void {
    this.snapshotCallbacks.push(cb)
    cb(this.currentSnapshot())
    return () => { this.snapshotCallbacks = this.snapshotCallbacks.filter((c) => c !== cb) }
  }

  onDailySummary(cb: DailySummaryCallback): () => void {
    this.dailyCallbacks.push(cb)
    cb(DAILY_SUMMARY)
    return () => { this.dailyCallbacks = this.dailyCallbacks.filter((c) => c !== cb) }
  }

  onHealth(cb: HealthCallback): () => void {
    this.healthCallbacks.push(cb)
    cb(HEALTH)
    return () => { this.healthCallbacks = this.healthCallbacks.filter((c) => c !== cb) }
  }

  onConnectionStatus(cb: ConnectionStatusCallback): () => void {
    this.statusCallbacks.push(cb)
    cb('connected')

    if (!this.timer) {
      this.timer = setInterval(() => {
        this.scenarioIndex = (this.scenarioIndex + 1) % SCENARIOS.length
        const snapshot = this.currentSnapshot()
        this.snapshotCallbacks.forEach((c) => c(snapshot))
      }, CYCLE_INTERVAL_MS)
    }

    return () => { this.statusCallbacks = this.statusCallbacks.filter((c) => c !== cb) }
  }

  disconnect(): void {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
  }
}
