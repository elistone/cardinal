import type { Meta, StoryObj } from '@storybook/vue3'
import { ref } from 'vue'
import type { EnergySnapshot, EnergyInsight, ConfigurationHealth } from '@cardinal/domain'
import InsightBlock from '../components/InsightBlock.vue'
import MetricCard from '../components/MetricCard.vue'
import EnergyFlowDiagram from '../components/EnergyFlowDiagram.vue'
import SensorHealthBadge from '../components/SensorHealthBadge.vue'
import SensorHealthOverlay from '../components/SensorHealthOverlay.vue'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const SOLAR_CHARGING: EnergySnapshot = {
  timestamp: new Date('2025-06-01T12:30:00Z'),
  solar:   { generatingWatts: 3600, isGenerating: true },
  battery: { chargePercent: 68, chargingWatts: 1800, dischargingWatts: 0, isCharging: true, isDischarging: false, isIdle: false },
  grid:    { importingWatts: 0, exportingWatts: 800, isImporting: false, isExporting: true, isIdle: false },
  home:    { consumingWatts: 1000 },
}

const SOLAR_EXPORTING: EnergySnapshot = {
  timestamp: new Date('2025-06-01T13:00:00Z'),
  solar:   { generatingWatts: 4500, isGenerating: true },
  battery: { chargePercent: 100, chargingWatts: 0, dischargingWatts: 0, isCharging: false, isDischarging: false, isIdle: true },
  grid:    { importingWatts: 0, exportingWatts: 3000, isImporting: false, isExporting: true, isIdle: false },
  home:    { consumingWatts: 1500 },
}

const BATTERY_DISCHARGING: EnergySnapshot = {
  timestamp: new Date('2025-06-01T19:30:00Z'),
  solar:   { generatingWatts: 0, isGenerating: false },
  battery: { chargePercent: 80, chargingWatts: 0, dischargingWatts: 2000, isCharging: false, isDischarging: true, isIdle: false },
  grid:    { importingWatts: 0, exportingWatts: 0, isImporting: false, isExporting: false, isIdle: true },
  home:    { consumingWatts: 2000 },
}

const GRID_POWER: EnergySnapshot = {
  timestamp: new Date('2025-06-01T23:00:00Z'),
  solar:   { generatingWatts: 0, isGenerating: false },
  battery: { chargePercent: 55, chargingWatts: 0, dischargingWatts: 0, isCharging: false, isDischarging: false, isIdle: true },
  grid:    { importingWatts: 850, exportingWatts: 0, isImporting: true, isExporting: false, isIdle: false },
  home:    { consumingWatts: 850 },
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

// ─── Layout helpers ───────────────────────────────────────────────────────────

function batteryDirection(snapshot: EnergySnapshot): string {
  const b = snapshot.battery
  const pct = `${b.chargePercent}%`
  if (b.isCharging) return `${pct} · Charging`
  if (b.isDischarging) return `${pct} · Discharging`
  return `${pct} · Standby`
}

function gridDirection(snapshot: EnergySnapshot): string {
  const g = snapshot.grid
  if (g.isImporting) return 'Importing'
  if (g.isExporting) return 'Exporting'
  return 'Idle'
}

function gridValue(snapshot: EnergySnapshot): number {
  return snapshot.grid.isImporting ? snapshot.grid.importingWatts : snapshot.grid.exportingWatts
}

function batteryValue(snapshot: EnergySnapshot): number {
  const b = snapshot.battery
  if (b.isCharging) return b.chargingWatts
  if (b.isDischarging) return b.dischargingWatts
  return 0
}

// ─── NOW Panel layout component (for stories only) ────────────────────────────

const NowPanelLayout = {
  props: ['snapshot', 'insight'],
  components: { InsightBlock, MetricCard, EnergyFlowDiagram },
  template: `
    <div style="
      display: flex;
      flex-direction: column;
      gap: 24px;
      padding: 24px;
      background: var(--color-bg);
      min-height: 100vh;
      box-sizing: border-box;
    ">
      <p style="
        margin: 0;
        font-size: 0.6875rem;
        font-weight: 700;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        color: var(--color-text-subdued);
      ">NOW</p>

      <InsightBlock
        :title="insight.title"
        :description="insight.description"
        :detail="insight.detail"
        :sentiment="insight.sentiment"
        :confidence="insight.confidence"
      />

      <div style="
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px;
      ">
        <EnergyFlowDiagram :snapshot="snapshot" />

        <div style="display: grid; grid-template-columns: 1fr; gap: 12px;">
          <MetricCard
            label="Solar output"
            :value="snapshot.solar.generatingWatts"
            unit="W"
            concept="solar"
          />
          <MetricCard
            label="Battery"
            :value="batteryValue(snapshot)"
            unit="W"
            concept="battery"
            :direction-label="batteryDirection(snapshot)"
          />
          <MetricCard
            label="Grid"
            :value="gridValue(snapshot)"
            unit="W"
            concept="grid"
            :direction-label="gridDirection(snapshot)"
          />
          <MetricCard
            label="Home consumption"
            :value="snapshot.home.consumingWatts"
            unit="W"
            concept="home"
          />
        </div>
      </div>
    </div>
  `,
  methods: { batteryDirection, batteryValue, gridDirection, gridValue },
}

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta = {
  title: 'Layout/NOW Panel',
  parameters: {
    layout: 'fullscreen',
  },
}

export default meta
type Story = StoryObj

// ─── Live states ──────────────────────────────────────────────────────────────

export const ChargingFromSolar: Story = {
  name: 'Live — Charging from Solar',
  render: () => ({
    components: { NowPanelLayout },
    setup() {
      const insight: EnergyInsight = {
        id: 'fixture-1',
        type: 'battery_charging_solar',
        sentiment: 'positive',
        priority: 'normal',
        confidence: 'high',
        timestamp: SOLAR_CHARGING.timestamp,
        title: 'Charging from Solar',
        description: 'Your battery is charging from excess solar.',
        detail: 'Battery is at 68% and rising. Also sending 800 W to the grid.',
      }
      return { snapshot: SOLAR_CHARGING, insight }
    },
    template: '<NowPanelLayout :snapshot="snapshot" :insight="insight" />',
  }),
}

export const ExportingSolar: Story = {
  name: 'Live — Exporting Solar',
  render: () => ({
    components: { NowPanelLayout },
    setup() {
      const insight: EnergyInsight = {
        id: 'fixture-2',
        type: 'solar_exporting',
        sentiment: 'positive',
        priority: 'normal',
        confidence: 'high',
        timestamp: SOLAR_EXPORTING.timestamp,
        title: 'Exporting Solar',
        description: "You're generating more solar than you need.",
        detail: 'Sending 3 kW to the grid.',
      }
      return { snapshot: SOLAR_EXPORTING, insight }
    },
    template: '<NowPanelLayout :snapshot="snapshot" :insight="insight" />',
  }),
}

export const BatteryDischarging: Story = {
  name: 'Live — Running on Battery',
  render: () => ({
    components: { NowPanelLayout },
    setup() {
      const insight: EnergyInsight = {
        id: 'fixture-3',
        type: 'battery_discharging',
        sentiment: 'positive',
        priority: 'normal',
        confidence: 'high',
        timestamp: BATTERY_DISCHARGING.timestamp,
        title: 'Running on Battery',
        description: 'Your home is running on battery power. No grid draw.',
        detail: 'Battery is at 80% and supplying 2 kW.',
      }
      return { snapshot: BATTERY_DISCHARGING, insight }
    },
    template: '<NowPanelLayout :snapshot="snapshot" :insight="insight" />',
  }),
}

export const GridPowerOvernight: Story = {
  name: 'Live — Grid Power (night)',
  render: () => ({
    components: { NowPanelLayout },
    setup() {
      const insight: EnergyInsight = {
        id: 'fixture-4',
        type: 'grid_importing',
        sentiment: 'neutral',
        priority: 'normal',
        confidence: 'high',
        timestamp: GRID_POWER.timestamp,
        title: 'Grid Power',
        description: 'Your home is running on grid power.',
        detail: 'No solar generation right now.',
      }
      return { snapshot: GRID_POWER, insight }
    },
    template: '<NowPanelLayout :snapshot="snapshot" :insight="insight" />',
  }),
}

// ─── System states ────────────────────────────────────────────────────────────

export const Loading: Story = {
  name: 'State — Loading',
  render: () => ({
    components: { InsightBlock, MetricCard, EnergyFlowDiagram },
    template: `
      <div style="display:flex;flex-direction:column;gap:24px;padding:24px;background:var(--color-bg);min-height:100vh;box-sizing:border-box;">
        <p style="margin:0;font-size:0.6875rem;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--color-text-subdued);">NOW</p>
        <InsightBlock title="" description="" sentiment="neutral" confidence="high" :is-loading="true" />
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;">
          <EnergyFlowDiagram :snapshot="null" :is-loading="true" />
          <div style="display:grid;grid-template-columns:1fr;gap:12px;">
            <MetricCard label="" :value="0" unit="W" concept="solar" :is-loading="true" />
            <MetricCard label="" :value="0" unit="W" concept="battery" :is-loading="true" />
            <MetricCard label="" :value="0" unit="W" concept="grid" :is-loading="true" />
            <MetricCard label="" :value="0" unit="W" concept="home" :is-loading="true" />
          </div>
        </div>
      </div>
    `,
  }),
}

export const NoConfiguration: Story = {
  name: 'State — No Configuration',
  render: () => ({
    template: `
      <div style="display:flex;align-items:center;justify-content:center;min-height:100vh;background:var(--color-bg);padding:24px;box-sizing:border-box;">
        <div style="max-width:420px;width:100%;text-align:center;display:flex;flex-direction:column;align-items:center;gap:16px;">
          <div style="font-size:3rem;line-height:1;opacity:0.3;">⚡</div>
          <h2 style="margin:0;font-size:1.375rem;font-weight:700;color:var(--color-text-primary);">Set up Cardinal</h2>
          <p style="margin:0;font-size:1rem;line-height:1.6;color:var(--color-text-secondary);">
            Cardinal isn't connected to your home yet. Add your sensor mappings to start seeing live energy data.
          </p>
          <p style="margin:0;font-size:0.875rem;line-height:1.5;color:var(--color-text-subdued);background:var(--color-surface-raised);border:1px solid var(--color-border);border-radius:10px;padding:16px 20px;">
            Go to <strong style="color:var(--color-text-secondary);font-weight:600;">Settings → Integrations → Cardinal</strong> in Home Assistant to configure your sensors.
          </p>
        </div>
      </div>
    `,
  }),
}

export const Disconnected: Story = {
  name: 'State — Disconnected (with stale data)',
  render: () => ({
    components: { NowPanelLayout },
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
      <div style="display:flex;flex-direction:column;min-height:100vh;background:var(--color-bg);box-sizing:border-box;">
        <div style="display:flex;align-items:center;gap:8px;padding:12px 24px;background:rgba(245,158,11,0.08);border-bottom:1px solid rgba(245,158,11,0.15);font-size:0.875rem;color:var(--color-health-unavailable);">
          <span style="width:7px;height:7px;border-radius:50%;background:var(--color-health-unavailable);flex-shrink:0;"></span>
          Reconnecting to Home Assistant…
        </div>
        <div style="opacity:0.5;pointer-events:none;flex:1;">
          <NowPanelLayout :snapshot="snapshot" :insight="insight" />
        </div>
      </div>
    `,
  }),
}

export const WithSensorHealthOverlay: Story = {
  name: 'Interaction — Sensor Health Overlay',
  render: () => ({
    components: { SensorHealthOverlay, SensorHealthBadge },
    setup() {
      const isOpen = ref(true)
      return { isOpen, health: ALL_CONFIGURED }
    },
    template: `
      <div style="min-height:100vh;background:var(--color-bg);">
        <SensorHealthOverlay :health="health" :is-open="isOpen" @close="isOpen = false" />
      </div>
    `,
  }),
}
