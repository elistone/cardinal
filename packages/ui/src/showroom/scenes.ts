import type { EnergySnapshot, EnergyInsight } from '@cardinal/domain'

export interface ShowroomScene {
  readonly id: string
  readonly label: string
  readonly time: string
  readonly snapshot: EnergySnapshot
  readonly insight: EnergyInsight
  readonly durationMs: number
}

// Reference date: a summer solstice day with good solar potential.
function ts(hour: number, minute = 0): Date {
  return new Date(2026, 5, 27, hour, minute, 0)
}

export const SHOWROOM_SCENES: ShowroomScene[] = [
  // ── 1. Overnight (02:00) ────────────────────────────────────────────────────
  // Deep night. Battery resting, grid covers a modest overnight load.
  {
    id: 'overnight',
    label: 'Overnight',
    time: '02:00',
    durationMs: 4000,
    snapshot: {
      timestamp: ts(2),
      solar:   { generatingWatts: 0, isGenerating: false },
      battery: { chargePercent: 42, chargingWatts: 0, dischargingWatts: 0, isCharging: false, isDischarging: false, isIdle: true },
      grid:    { importingWatts: 620, exportingWatts: 0, isImporting: true, isExporting: false, isIdle: false },
      home:    { consumingWatts: 620 },
      tariffs: { importRate: 0.245, exportRate: 0.15, currency: 'GBP' },
    },
    insight: {
      id: 'overnight',
      type: 'grid_importing',
      sentiment: 'neutral',
      priority: 'normal',
      confidence: 'high',
      timestamp: ts(2),
      title: 'Grid Overnight',
      description: 'Your home is running on grid power. The battery is resting.',
      detail: 'Solar picks up again at sunrise.',
    },
  },

  // ── 2. Sunrise (06:30) ──────────────────────────────────────────────────────
  // Low-angle morning sun starts contributing. Still drawing a little from grid.
  {
    id: 'sunrise',
    label: 'Sunrise',
    time: '06:30',
    durationMs: 4000,
    snapshot: {
      timestamp: ts(6, 30),
      solar:   { generatingWatts: 230, isGenerating: true },
      battery: { chargePercent: 40, chargingWatts: 0, dischargingWatts: 0, isCharging: false, isDischarging: false, isIdle: true },
      grid:    { importingWatts: 370, exportingWatts: 0, isImporting: true, isExporting: false, isIdle: false },
      home:    { consumingWatts: 600 },
      tariffs: { importRate: 0.245, exportRate: 0.15, currency: 'GBP' },
    },
    insight: {
      id: 'sunrise',
      type: 'solar_covering',
      sentiment: 'positive',
      priority: 'normal',
      confidence: 'high',
      timestamp: ts(6, 30),
      title: 'Solar Starting',
      description: 'The sun is rising. Solar is beginning to reduce your grid use.',
      detail: '230 W of solar is cutting how much you import from the grid.',
    },
  },

  // ── 3. Morning charging (09:30) ─────────────────────────────────────────────
  // Good solar. Battery charging. Home drawing directly from panels.
  {
    id: 'morning-charge',
    label: 'Charging from Solar',
    time: '09:30',
    durationMs: 4000,
    snapshot: {
      timestamp: ts(9, 30),
      solar:   { generatingWatts: 2800, isGenerating: true },
      battery: { chargePercent: 58, chargingWatts: 1400, dischargingWatts: 0, isCharging: true, isDischarging: false, isIdle: false },
      grid:    { importingWatts: 0, exportingWatts: 0, isImporting: false, isExporting: false, isIdle: true },
      home:    { consumingWatts: 1400 },
      tariffs: { importRate: 0.245, exportRate: 0.15, currency: 'GBP' },
    },
    insight: {
      id: 'morning-charge',
      type: 'battery_charging_solar',
      sentiment: 'positive',
      priority: 'normal',
      confidence: 'high',
      timestamp: ts(9, 30),
      title: 'Charging from Solar',
      description: 'Excess solar is charging your battery. No grid energy is being used.',
      detail: 'Battery is at 58% and rising.',
    },
  },

  // ── 4. Peak export (12:00) ──────────────────────────────────────────────────
  // Maximum solar generation. Battery full. Exporting heavily to the grid.
  {
    id: 'peak-export',
    label: 'Exporting Solar',
    time: '12:00',
    durationMs: 4500,
    snapshot: {
      timestamp: ts(12),
      solar:   { generatingWatts: 4800, isGenerating: true },
      battery: { chargePercent: 100, chargingWatts: 0, dischargingWatts: 0, isCharging: false, isDischarging: false, isIdle: true },
      grid:    { importingWatts: 0, exportingWatts: 3300, isImporting: false, isExporting: true, isIdle: false },
      home:    { consumingWatts: 1500 },
      tariffs: { importRate: 0.245, exportRate: 0.15, currency: 'GBP' },
    },
    insight: {
      id: 'peak-export',
      type: 'solar_exporting',
      sentiment: 'positive',
      priority: 'normal',
      confidence: 'high',
      timestamp: ts(12),
      title: 'Exporting Solar',
      description: "Battery is full. You're sending surplus solar to the grid.",
      detail: "You've exported 6.3 kWh so far today.",
    },
  },

  // ── 5. Running on Solar (15:00) ─────────────────────────────────────────────
  // Afternoon. Solar exactly covers home. Battery full, grid idle. Clean state.
  {
    id: 'solar-only',
    label: 'Running on Solar',
    time: '15:00',
    durationMs: 4000,
    snapshot: {
      timestamp: ts(15),
      solar:   { generatingWatts: 2200, isGenerating: true },
      battery: { chargePercent: 100, chargingWatts: 0, dischargingWatts: 0, isCharging: false, isDischarging: false, isIdle: true },
      grid:    { importingWatts: 0, exportingWatts: 0, isImporting: false, isExporting: false, isIdle: true },
      home:    { consumingWatts: 2200 },
      tariffs: { importRate: 0.245, exportRate: 0.15, currency: 'GBP' },
    },
    insight: {
      id: 'solar-only',
      type: 'solar_covering',
      sentiment: 'positive',
      priority: 'normal',
      confidence: 'high',
      timestamp: ts(15),
      title: 'Running on Solar',
      description: 'Your home is running entirely on solar. Battery is fully charged.',
      detail: 'Grid is completely idle.',
    },
  },

  // ── 6. Sunset (18:30) ───────────────────────────────────────────────────────
  // Low-angle evening sun. Battery picking up the shortfall as solar fades.
  {
    id: 'sunset',
    label: 'Solar Fading',
    time: '18:30',
    durationMs: 4000,
    snapshot: {
      timestamp: ts(18, 30),
      solar:   { generatingWatts: 420, isGenerating: true },
      battery: { chargePercent: 97, chargingWatts: 0, dischargingWatts: 1300, isCharging: false, isDischarging: true, isIdle: false },
      grid:    { importingWatts: 0, exportingWatts: 0, isImporting: false, isExporting: false, isIdle: true },
      home:    { consumingWatts: 1720 },
      tariffs: { importRate: 0.245, exportRate: 0.15, currency: 'GBP' },
    },
    insight: {
      id: 'sunset',
      type: 'battery_discharging',
      sentiment: 'positive',
      priority: 'normal',
      confidence: 'high',
      timestamp: ts(18, 30),
      title: 'Battery Taking Over',
      description: 'Solar is fading. Your battery is covering the shortfall.',
      detail: 'Battery is at 97%, supplying 1.3 kW.',
    },
  },

  // ── 7. Evening on battery (20:30) ───────────────────────────────────────────
  // No solar. Battery providing all home power. Grid idle.
  {
    id: 'evening-battery',
    label: 'Running on Battery',
    time: '20:30',
    durationMs: 4000,
    snapshot: {
      timestamp: ts(20, 30),
      solar:   { generatingWatts: 0, isGenerating: false },
      battery: { chargePercent: 73, chargingWatts: 0, dischargingWatts: 2100, isCharging: false, isDischarging: true, isIdle: false },
      grid:    { importingWatts: 0, exportingWatts: 0, isImporting: false, isExporting: false, isIdle: true },
      home:    { consumingWatts: 2100 },
      tariffs: { importRate: 0.245, exportRate: 0.15, currency: 'GBP' },
    },
    insight: {
      id: 'evening-battery',
      type: 'battery_discharging',
      sentiment: 'positive',
      priority: 'normal',
      confidence: 'high',
      timestamp: ts(20, 30),
      title: 'Running on Battery',
      description: 'Your home is running on battery power. No solar and no grid import.',
      detail: 'Battery at 73%, supplying 2.1 kW.',
    },
  },

  // ── 8. Late night grid (23:00) ──────────────────────────────────────────────
  // Battery held in reserve. Grid covers overnight baseload. Cycle restarts.
  {
    id: 'late-night',
    label: 'Grid overnight',
    time: '23:00',
    durationMs: 4000,
    snapshot: {
      timestamp: ts(23),
      solar:   { generatingWatts: 0, isGenerating: false },
      battery: { chargePercent: 28, chargingWatts: 0, dischargingWatts: 0, isCharging: false, isDischarging: false, isIdle: true },
      grid:    { importingWatts: 850, exportingWatts: 0, isImporting: true, isExporting: false, isIdle: false },
      home:    { consumingWatts: 850 },
      tariffs: { importRate: 0.245, exportRate: 0.15, currency: 'GBP' },
    },
    insight: {
      id: 'late-night',
      type: 'grid_importing',
      sentiment: 'neutral',
      priority: 'normal',
      confidence: 'high',
      timestamp: ts(23),
      title: 'Grid Overnight',
      description: 'The battery is resting. Your home is running on grid power.',
      detail: 'Solar picks up again at sunrise.',
    },
  },
]
