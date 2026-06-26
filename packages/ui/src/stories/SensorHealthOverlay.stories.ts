import type { Meta, StoryObj } from '@storybook/vue3'
import { ref } from 'vue'
import SensorHealthOverlay from '../components/SensorHealthOverlay.vue'
import type { ConfigurationHealth } from '@cardinal/domain'

const allConfigured: ConfigurationHealth = {
  live: {
    solar:             { status: 'configured', entityId: 'sensor.pv_power' },
    batteryCharging:   { status: 'configured', entityId: 'sensor.battery_charge_power' },
    batteryDischarging:{ status: 'configured', entityId: 'sensor.battery_discharge_power' },
    batteryLevel:      { status: 'configured', entityId: 'sensor.battery_soc' },
    gridImport:        { status: 'configured', entityId: 'sensor.power_from_grid' },
    gridExport:        { status: 'configured', entityId: 'sensor.power_to_grid' },
    homeConsumption:   { status: 'configured', entityId: 'sensor.load_power' },
  },
  daily: {
    solarGenerated:     { status: 'configured', entityId: 'sensor.solar_energy_today' },
    batteryCharged:     { status: 'configured', entityId: 'sensor.battery_charged_today' },
    batteryDischarged:  { status: 'configured', entityId: 'sensor.battery_discharged_today' },
    gridImported:       { status: 'configured', entityId: 'sensor.grid_imported_today' },
    gridExported:       { status: 'configured', entityId: 'sensor.grid_exported_today' },
    homeConsumed:       { status: 'configured', entityId: 'sensor.home_consumed_today' },
  },
}

const partialHealth: ConfigurationHealth = {
  live: {
    solar:             { status: 'configured', entityId: 'sensor.pv_power' },
    batteryCharging:   { status: 'unavailable', entityId: 'sensor.battery_charge_power' },
    batteryDischarging:{ status: 'unavailable', entityId: 'sensor.battery_discharge_power' },
    batteryLevel:      { status: 'configured', entityId: 'sensor.battery_soc' },
    gridImport:        { status: 'configured', entityId: 'sensor.power_from_grid' },
    gridExport:        { status: 'configured', entityId: 'sensor.power_to_grid' },
    homeConsumption:   { status: 'configured', entityId: 'sensor.load_power' },
  },
  daily: {
    solarGenerated:     { status: 'configured', entityId: 'sensor.solar_energy_today' },
    batteryCharged:     { status: 'missing' },
    batteryDischarged:  { status: 'missing' },
    gridImported:       { status: 'configured', entityId: 'sensor.grid_imported_today' },
    gridExported:       { status: 'configured', entityId: 'sensor.grid_exported_today' },
    homeConsumed:       { status: 'invalid', entityId: 'sensor.home_consumed_today' },
  },
}

const meta: Meta<typeof SensorHealthOverlay> = {
  title: 'Components/SensorHealthOverlay',
  component: SensorHealthOverlay,
  parameters: {
    layout: 'fullscreen',
  },
}

export default meta
type Story = StoryObj<typeof SensorHealthOverlay>

export const AllHealthy: Story = {
  name: 'All sensors healthy',
  render: () => ({
    setup() {
      const isOpen = ref(true)
      return { isOpen, health: allConfigured }
    },
    template: `
      <div style="position: relative; height: 100vh; background: #0f1117;">
        <button
          style="margin: 24px; padding: 8px 16px; background: #232838; color: #f1f5f9; border: 1px solid rgba(255,255,255,0.08); border-radius: 6px; cursor: pointer;"
          @click="isOpen = true"
        >
          Open overlay
        </button>
        <SensorHealthOverlay :health="health" :is-open="isOpen" @close="isOpen = false" />
      </div>
    `,
    components: { SensorHealthOverlay },
  }),
}

export const WithProblems: Story = {
  name: 'Sensors with problems',
  render: () => ({
    setup() {
      const isOpen = ref(true)
      return { isOpen, health: partialHealth }
    },
    template: `
      <div style="position: relative; height: 100vh; background: #0f1117;">
        <button
          style="margin: 24px; padding: 8px 16px; background: #232838; color: #f1f5f9; border: 1px solid rgba(255,255,255,0.08); border-radius: 6px; cursor: pointer;"
          @click="isOpen = true"
        >
          Open overlay
        </button>
        <SensorHealthOverlay :health="health" :is-open="isOpen" @close="isOpen = false" />
      </div>
    `,
    components: { SensorHealthOverlay },
  }),
}

export const Closed: Story = {
  args: {
    health: allConfigured,
    isOpen: false,
  },
}
