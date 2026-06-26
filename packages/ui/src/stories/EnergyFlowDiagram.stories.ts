import type { Meta, StoryObj } from '@storybook/vue3'
import EnergyFlowDiagram from '../components/EnergyFlowDiagram.vue'
import type { EnergySnapshot } from '@cardinal/domain'

// Snapshots matching the integration test fixtures

const batteryChargingSolar: EnergySnapshot = {
  timestamp: new Date('2025-06-01T12:30:00Z'),
  solar:   { generatingWatts: 3600, isGenerating: true },
  battery: { chargePercent: 68, chargingWatts: 1800, dischargingWatts: 0, isCharging: true, isDischarging: false, isIdle: false },
  grid:    { importingWatts: 0, exportingWatts: 800, isImporting: false, isExporting: true, isIdle: false },
  home:    { consumingWatts: 1000 },
}

const runningOnSolar: EnergySnapshot = {
  timestamp: new Date('2025-06-01T11:00:00Z'),
  solar:   { generatingWatts: 1800, isGenerating: true },
  battery: { chargePercent: 100, chargingWatts: 0, dischargingWatts: 0, isCharging: false, isDischarging: false, isIdle: true },
  grid:    { importingWatts: 0, exportingWatts: 0, isImporting: false, isExporting: false, isIdle: true },
  home:    { consumingWatts: 1800 },
}

const solarExporting: EnergySnapshot = {
  timestamp: new Date('2025-06-01T13:00:00Z'),
  solar:   { generatingWatts: 4500, isGenerating: true },
  battery: { chargePercent: 100, chargingWatts: 0, dischargingWatts: 0, isCharging: false, isDischarging: false, isIdle: true },
  grid:    { importingWatts: 0, exportingWatts: 3000, isImporting: false, isExporting: true, isIdle: false },
  home:    { consumingWatts: 1500 },
}

const batteryDischarging: EnergySnapshot = {
  timestamp: new Date('2025-06-01T19:30:00Z'),
  solar:   { generatingWatts: 0, isGenerating: false },
  battery: { chargePercent: 80, chargingWatts: 0, dischargingWatts: 2000, isCharging: false, isDischarging: true, isIdle: false },
  grid:    { importingWatts: 0, exportingWatts: 0, isImporting: false, isExporting: false, isIdle: true },
  home:    { consumingWatts: 2000 },
}

const gridPower: EnergySnapshot = {
  timestamp: new Date('2025-06-01T23:00:00Z'),
  solar:   { generatingWatts: 0, isGenerating: false },
  battery: { chargePercent: 55, chargingWatts: 0, dischargingWatts: 0, isCharging: false, isDischarging: false, isIdle: true },
  grid:    { importingWatts: 850, exportingWatts: 0, isImporting: true, isExporting: false, isIdle: false },
  home:    { consumingWatts: 850 },
}

const meta: Meta<typeof EnergyFlowDiagram> = {
  title: 'Components/EnergyFlowDiagram',
  component: EnergyFlowDiagram,
  parameters: {
    layout: 'padded',
  },
  decorators: [
    () => ({ template: '<div style="max-width: 400px; margin: 0 auto;"><story /></div>' }),
  ],
}

export default meta
type Story = StoryObj<typeof EnergyFlowDiagram>

export const BatteryChargingFromSolar: Story = {
  args: {
    snapshot: batteryChargingSolar,
  },
}

export const RunningOnSolar: Story = {
  args: {
    snapshot: runningOnSolar,
  },
}

export const ExportingSolar: Story = {
  args: {
    snapshot: solarExporting,
  },
}

export const BatteryDischarging: Story = {
  args: {
    snapshot: batteryDischarging,
  },
}

export const GridPowerOnly: Story = {
  args: {
    snapshot: gridPower,
  },
}

export const NoData: Story = {
  name: 'No snapshot (night idle)',
  args: {
    snapshot: null,
  },
}

export const Loading: Story = {
  args: {
    snapshot: null,
    isLoading: true,
  },
}
