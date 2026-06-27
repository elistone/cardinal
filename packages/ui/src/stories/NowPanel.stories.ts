import type { Meta, StoryObj } from '@storybook/vue3'
import { ref } from 'vue'
import type { EnergySnapshot, EnergyInsight, ConfigurationHealth } from '@cardinal/domain'
import NowPanel from '../components/NowPanel.vue'
import SensorHealthOverlay from '../components/SensorHealthOverlay.vue'
import { useShowroomMode } from '../composables/useShowroomMode.js'
import { SHOWROOM_SCENES } from '../showroom/scenes.js'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const SOLAR_CHARGING: EnergySnapshot = {
  timestamp: new Date('2025-06-01T12:30:00Z'),
  solar:   { generatingWatts: 3600, isGenerating: true },
  battery: { chargePercent: 68, chargingWatts: 1800, dischargingWatts: 0, isCharging: true, isDischarging: false, isIdle: false },
  grid:    { importingWatts: 0, exportingWatts: 800, isImporting: false, isExporting: true, isIdle: false },
  home:    { consumingWatts: 1000 },
  tariffs: { importRate: 0.245, exportRate: 0.15, currency: 'GBP' },
}

const SOLAR_EXPORTING: EnergySnapshot = {
  timestamp: new Date('2025-06-01T13:00:00Z'),
  solar:   { generatingWatts: 4500, isGenerating: true },
  battery: { chargePercent: 100, chargingWatts: 0, dischargingWatts: 0, isCharging: false, isDischarging: false, isIdle: true },
  grid:    { importingWatts: 0, exportingWatts: 3000, isImporting: false, isExporting: true, isIdle: false },
  home:    { consumingWatts: 1500 },
  tariffs: { importRate: 0.245, exportRate: 0.15, currency: 'GBP' },
}

const BATTERY_DISCHARGING: EnergySnapshot = {
  timestamp: new Date('2025-06-01T19:30:00Z'),
  solar:   { generatingWatts: 0, isGenerating: false },
  battery: { chargePercent: 80, chargingWatts: 0, dischargingWatts: 2000, isCharging: false, isDischarging: true, isIdle: false },
  grid:    { importingWatts: 0, exportingWatts: 0, isImporting: false, isExporting: false, isIdle: true },
  home:    { consumingWatts: 2000 },
  tariffs: { importRate: null, exportRate: null, currency: 'GBP' },
}

const GRID_POWER: EnergySnapshot = {
  timestamp: new Date('2025-06-01T23:00:00Z'),
  solar:   { generatingWatts: 0, isGenerating: false },
  battery: { chargePercent: 55, chargingWatts: 0, dischargingWatts: 0, isCharging: false, isDischarging: false, isIdle: true },
  grid:    { importingWatts: 850, exportingWatts: 0, isImporting: true, isExporting: false, isIdle: false },
  home:    { consumingWatts: 850 },
  tariffs: { importRate: 0.245, exportRate: 0.15, currency: 'GBP' },
}

const ALL_CONFIGURED: ConfigurationHealth = {
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

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta<typeof NowPanel> = {
  title: 'Layout/NOW Panel',
  component: NowPanel,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    () => ({
      template: `
        <div style="
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          background: var(--color-bg);
        ">
          <story />
        </div>
      `,
    }),
  ],
}

export default meta
type Story = StoryObj<typeof NowPanel>

// ─── Live states ──────────────────────────────────────────────────────────────

export const ChargingFromSolar: Story = {
  name: 'Live — Charging from Solar',
  args: {
    snapshot: SOLAR_CHARGING,
    insight: {
      id: 'fixture-1',
      type: 'battery_charging_solar',
      sentiment: 'positive',
      priority: 'normal',
      confidence: 'high',
      timestamp: SOLAR_CHARGING.timestamp,
      title: 'Charging from Solar',
      description: 'Your battery is charging from excess solar.',
      detail: 'Battery is at 68% and rising. Also sending 800 W to the grid.',
    },
  },
}

export const ExportingSolar: Story = {
  name: 'Live — Exporting Solar',
  args: {
    snapshot: SOLAR_EXPORTING,
    insight: {
      id: 'fixture-2',
      type: 'solar_exporting',
      sentiment: 'positive',
      priority: 'normal',
      confidence: 'high',
      timestamp: SOLAR_EXPORTING.timestamp,
      title: 'Exporting Solar',
      description: "You're generating more solar than you need.",
      detail: 'Sending 3 kW to the grid.',
    },
  },
}

export const BatteryDischarging: Story = {
  name: 'Live — Running on Battery',
  args: {
    snapshot: BATTERY_DISCHARGING,
    insight: {
      id: 'fixture-3',
      type: 'battery_discharging',
      sentiment: 'positive',
      priority: 'normal',
      confidence: 'high',
      timestamp: BATTERY_DISCHARGING.timestamp,
      title: 'Running on Battery',
      description: 'Your home is running on battery power. No grid draw.',
      detail: 'Battery is at 80% and supplying 2 kW.',
    },
  },
}

export const GridPowerOvernight: Story = {
  name: 'Live — Grid Power (night)',
  args: {
    snapshot: GRID_POWER,
    insight: {
      id: 'fixture-4',
      type: 'grid_importing',
      sentiment: 'neutral',
      priority: 'normal',
      confidence: 'high',
      timestamp: GRID_POWER.timestamp,
      title: 'Grid Power',
      description: 'Your home is running on grid power.',
      detail: 'No solar generation right now.',
    },
  },
}

// ─── System states ────────────────────────────────────────────────────────────

export const Loading: Story = {
  name: 'State — Loading',
  args: {
    snapshot: null,
    insight: null,
  },
}

export const Disconnected: Story = {
  name: 'State — Disconnected (with stale data)',
  render: () => ({
    components: { NowPanel },
    setup() {
      const insight: EnergyInsight = {
        id: 'fixture-stale',
        type: 'battery_charging_solar',
        sentiment: 'positive',
        priority: 'normal',
        confidence: 'high',
        timestamp: SOLAR_CHARGING.timestamp,
        title: 'Charging from Solar',
        description: 'Your battery is charging from excess solar.',
        detail: 'Battery is at 68% and rising.',
      }
      return { snapshot: SOLAR_CHARGING, insight }
    },
    template: `
      <div style="display:flex;flex-direction:column;flex:1;">
        <div style="
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 24px;
          background: rgba(245,158,11,0.08);
          border-bottom: 1px solid rgba(245,158,11,0.15);
          font-size: 0.875rem;
          color: var(--color-health-unavailable);
          flex-shrink: 0;
        ">
          <span style="width:7px;height:7px;border-radius:50%;background:var(--color-health-unavailable);flex-shrink:0;"></span>
          Reconnecting to Home Assistant…
        </div>
        <div style="opacity:0.5;pointer-events:none;flex:1;display:flex;flex-direction:column;">
          <NowPanel :snapshot="snapshot" :insight="insight" />
        </div>
      </div>
    `,
  }),
}

// ─── Showroom ─────────────────────────────────────────────────────────────────
// Cycles all 8 scenes through a complete day, demonstrating every energy state
// Cardinal can explain. Each scene holds for ~4s then dissolves to the next.
// This is the authoritative demo for docs, screenshots, and marketing.

export const Showroom: Story = {
  name: 'Showroom — Complete Day',
  render: () => ({
    components: { NowPanel },
    setup() {
      const { snapshot, insight, sceneLabel, sceneTime } = useShowroomMode(SHOWROOM_SCENES)
      return { snapshot, insight, sceneLabel, sceneTime }
    },
    template: `
      <div style="display:flex;flex-direction:column;flex:1;position:relative;">
        <div style="
          position: absolute;
          bottom: 16px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.6875rem;
          font-weight: 600;
          color: var(--color-text-subdued);
          letter-spacing: 0.06em;
          text-transform: uppercase;
          z-index: 10;
        ">
          <span style="
            width: 5px; height: 5px; border-radius: 50%;
            background: var(--color-positive);
          "></span>
          Showroom · {{ sceneTime }} · {{ sceneLabel }}
        </div>
        <NowPanel :snapshot="snapshot" :insight="insight" />
      </div>
    `,
  }),
}

export const WithSensorHealthOverlay: Story = {
  name: 'Interaction — Sensor Health Overlay',
  render: () => ({
    components: { SensorHealthOverlay },
    setup() {
      const isOpen = ref(true)
      return { isOpen, health: ALL_CONFIGURED }
    },
    template: `
      <div style="min-height:100vh;">
        <SensorHealthOverlay :health="health" :is-open="isOpen" @close="isOpen = false" />
      </div>
    `,
  }),
}
