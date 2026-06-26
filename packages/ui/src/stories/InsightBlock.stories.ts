import type { Meta, StoryObj } from '@storybook/vue3'
import InsightBlock from '../components/InsightBlock.vue'

const meta: Meta<typeof InsightBlock> = {
  title: 'Components/InsightBlock',
  component: InsightBlock,
  parameters: {
    layout: 'padded',
  },
  argTypes: {
    sentiment: { control: 'select', options: ['positive', 'neutral', 'negative'] },
    confidence: { control: 'select', options: ['high', 'medium', 'low'] },
  },
}

export default meta
type Story = StoryObj<typeof InsightBlock>

// --- Active states from real fixture scenarios ---

export const BatteryChargingFromSolar: Story = {
  args: {
    title: 'Charging from Solar',
    description: 'Your battery is charging from excess solar. No grid energy is being used.',
    detail: 'Battery is 68% full and rising. Exporting 800 W to the grid as well.',
    sentiment: 'positive',
    confidence: 'high',
  },
}

export const RunningOnSolar: Story = {
  args: {
    title: 'Running on Solar',
    description: 'Your home is running entirely on solar right now. Battery is full.',
    sentiment: 'positive',
    confidence: 'high',
  },
}

export const ExportingSolar: Story = {
  args: {
    title: 'Exporting Solar',
    description: "Your battery is full and solar is generating more than your home needs. You're exporting 3 kW to the grid.",
    detail: "You've exported 6.3 kWh so far today.",
    sentiment: 'positive',
    confidence: 'high',
  },
}

export const RunningOnBattery: Story = {
  args: {
    title: 'Running on Battery',
    description: 'Your home is running on battery power. No solar and no grid import.',
    detail: 'Battery is at 80% and supplying 2 kW.',
    sentiment: 'positive',
    confidence: 'high',
  },
}

export const GridPower: Story = {
  args: {
    title: 'Grid Power',
    description: 'Your home is running on grid power overnight. Solar generation has stopped.',
    detail: 'Battery is held in reserve at 55%.',
    sentiment: 'neutral',
    confidence: 'high',
  },
}

export const HighGridImport: Story = {
  args: {
    title: 'High Grid Import',
    description: 'Your home is drawing more grid power than usual. Battery has been depleted.',
    sentiment: 'negative',
    confidence: 'high',
  },
}

// --- Confidence states ---

export const EstimatedInsight: Story = {
  name: 'Estimated (low confidence)',
  args: {
    title: 'Running on Solar',
    description: 'Your home appears to be running on solar. Some sensor data is unavailable.',
    sentiment: 'positive',
    confidence: 'medium',
  },
}

// --- System states ---

export const Loading: Story = {
  args: {
    title: '',
    description: '',
    sentiment: 'neutral',
    confidence: 'high',
    isLoading: true,
  },
}
