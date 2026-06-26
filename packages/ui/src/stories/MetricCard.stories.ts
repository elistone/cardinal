import type { Meta, StoryObj } from '@storybook/vue3'
import MetricCard from '../components/MetricCard.vue'

const meta: Meta<typeof MetricCard> = {
  title: 'Components/MetricCard',
  component: MetricCard,
  parameters: {
    layout: 'padded',
  },
  argTypes: {
    concept: { control: 'select', options: ['solar', 'battery', 'grid', 'home'] },
  },
  decorators: [
    () => ({ template: '<div style="max-width: 200px"><story /></div>' }),
  ],
}

export default meta
type Story = StoryObj<typeof MetricCard>

// --- Solar ---

export const SolarGenerating: Story = {
  args: {
    label: 'Solar output',
    value: 3600,
    unit: 'W',
    concept: 'solar',
  },
}

export const SolarIdle: Story = {
  args: {
    label: 'Solar output',
    value: 0,
    unit: 'W',
    concept: 'solar',
  },
}

// --- Battery ---

export const BatteryCharging: Story = {
  args: {
    label: 'Battery',
    value: 1800,
    unit: 'W',
    concept: 'battery',
    directionLabel: 'Charging',
  },
}

export const BatteryDischarging: Story = {
  args: {
    label: 'Battery',
    value: 2000,
    unit: 'W',
    concept: 'battery',
    directionLabel: 'Discharging',
  },
}

export const BatteryIdle: Story = {
  args: {
    label: 'Battery',
    value: 0,
    unit: 'W',
    concept: 'battery',
    directionLabel: 'Standby',
  },
}

// --- Grid ---

export const GridImporting: Story = {
  args: {
    label: 'Grid',
    value: 850,
    unit: 'W',
    concept: 'grid',
    directionLabel: 'Importing',
  },
}

export const GridExporting: Story = {
  args: {
    label: 'Grid',
    value: 3000,
    unit: 'W',
    concept: 'grid',
    directionLabel: 'Exporting',
  },
}

// --- Home ---

export const HomeConsuming: Story = {
  args: {
    label: 'Home',
    value: 2100,
    unit: 'W',
    concept: 'home',
  },
}

// --- System states ---

export const Loading: Story = {
  args: {
    label: 'Solar output',
    value: 0,
    unit: 'W',
    concept: 'solar',
    isLoading: true,
  },
}

export const Unavailable: Story = {
  args: {
    label: 'Solar output',
    value: null,
    unit: 'W',
    concept: 'solar',
  },
}
